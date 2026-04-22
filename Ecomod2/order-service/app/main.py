import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine, SessionLocal
from app.models import Base, Order, OrderStatus
from app.event_bus import subscribe_events, publish_event
from app.notifier import notify_order_confirmed

logger = logging.getLogger(__name__)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Order Service",
    description="Microservicio de pedidos — Saga coreografiada con RabbitMQ",
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
        if event_type == "shipping.confirmed":
            # Saga paso 5: Shipping confirmó — completar orden
            order_id = data.get("order_id")
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                order.status = OrderStatus.confirmed
                db.commit()
                logger.info(f"Orden #{order_id} confirmada vía Saga")

                # Notificar al usuario
                email = data.get("email") or f"usuario_{order.user_id}@ecomod.com"
                await notify_order_confirmed(
                    order_id=order.id, user_id=order.user_id,
                    email=email, total=order.total_amount,
                    items_count=len(order.items)
                )

                # Publicar evento final
                await publish_event("order.confirmed", {
                    "order_id": order.id,
                    "user_id": order.user_id,
                    "status": "confirmed"
                })

        elif event_type == "inventory.failed":
            # Rollback: cancelar orden si no hay stock
            order_id = data.get("order_id")
            order = db.query(Order).filter(Order.id == order_id).first()
            if order and order.status == OrderStatus.pending:
                order.status = OrderStatus.cancelled
                order.notes = f"Cancelada: {data.get('reason', 'Stock insuficiente')}"
                db.commit()
                logger.info(f"Orden #{order_id} cancelada por falta de stock")

        elif event_type == "payment.failed":
            # Rollback: cancelar orden si falla el pago
            order_id = data.get("order_id")
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                order.status = OrderStatus.cancelled
                order.notes = f"Cancelada: pago fallido — {data.get('reason', '')}"
                db.commit()
                logger.info(f"Orden #{order_id} cancelada por pago fallido")

    finally:
        db.close()


@app.on_event("startup")
async def startup():
    asyncio.create_task(subscribe_events(
        routing_keys=["shipping.confirmed", "inventory.failed", "payment.failed"],
        callback=handle_event,
        queue_name="order-service-queue"
    ))
    logger.info("Order Service escuchando eventos RabbitMQ")


@app.get("/")
def root():
    return {
        "service": "order-service",
        "version": "2.0.0",
        "saga": "coreografiada con RabbitMQ",
        "events_published": ["order.created", "order.confirmed"],
        "events_consumed": ["shipping.confirmed", "inventory.failed", "payment.failed"]
    }