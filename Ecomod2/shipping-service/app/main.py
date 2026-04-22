import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine, SessionLocal
from app.models import Base, Shipment
from app.event_bus import subscribe_events, publish_event
from app.logistics import calculate_shipping_cost, generate_tracking_number
from app.notifier import notify_shipment_created

logger = logging.getLogger(__name__)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Shipping Service",
    description="Microservicio de envíos — Saga coreografiada con RabbitMQ",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(router)


async def handle_event(event_type: str, data: dict):
    """Maneja eventos del bus de mensajes."""
    db = SessionLocal()
    try:
        if event_type == "payment.succeeded":
            order_id = data.get("order_id")
            user_id = data.get("user_id")
            email = data.get("email") or f"usuario_{user_id}@ecomod.com"

            # Verificar si ya existe envío
            existing = db.query(Shipment).filter(
                Shipment.order_id == order_id
            ).first()
            if existing:
                logger.info(f"Envío ya existe para orden #{order_id}")
                return

            # Crear envío automático
            carrier = "Servientrega"
            department = "Bogotá"
            logistics = calculate_shipping_cost(department, carrier)
            tracking = generate_tracking_number(carrier)

            shipment = Shipment(
                order_id=order_id, user_id=user_id,
                recipient_name=f"Usuario {user_id}",
                address="Pendiente de confirmar",
                city="Bogotá", department=department,
                postal_code="110111", country="Colombia",
                carrier=carrier, tracking_number=tracking,
                shipping_cost=logistics["cost"],
                estimated_delivery=logistics["estimated_delivery"],
                status="processing"
            )
            db.add(shipment)
            db.commit()
            db.refresh(shipment)

            # Notificar al usuario
            estimated_str = logistics["estimated_delivery"].strftime("%d/%m/%Y") if logistics.get("estimated_delivery") else "Próximamente"
            await notify_shipment_created(
                shipment.id, order_id, user_id, email,
                tracking, carrier, estimated_str
            )

            # Publicar evento
            await publish_event("shipping.confirmed", {
                "order_id": order_id,
                "shipment_id": shipment.id,
                "user_id": user_id,
                "email": email,
                "tracking_number": tracking,
                "carrier": carrier
            })
            logger.info(f"Envío creado para orden #{order_id} — Tracking: {tracking}")

    finally:
        db.close()


@app.on_event("startup")
async def startup():
    asyncio.create_task(subscribe_events(
        routing_keys=["payment.succeeded"],
        callback=handle_event,
        queue_name="shipping-service-queue"
    ))
    logger.info("Shipping Service escuchando eventos RabbitMQ")


@app.get("/")
def root():
    return {
        "service": "shipping-service",
        "version": "2.0.0",
        "events_published": ["shipping.confirmed"],
        "events_consumed": ["payment.succeeded"]
    }