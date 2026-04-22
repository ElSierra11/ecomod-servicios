import asyncio
import logging
import httpx
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import Base, engine, SessionLocal
from app.models import Inventory
from app.event_bus import subscribe_events, publish_event

logger = logging.getLogger(__name__)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory Service",
    description="Microservicio de inventario — Saga coreografiada con RabbitMQ",
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
        if event_type == "order.created":
            order_id = data.get("order_id")
            items = data.get("items", [])
            reserved = []
            failed = False
            fail_reason = ""

            # Intentar reservar stock para cada item
            for item in items:
                product_id = item["product_id"]
                quantity = item["quantity"]

                inv = db.query(Inventory).filter(
                    Inventory.product_id == product_id
                ).first()

                if not inv:
                    failed = True
                    fail_reason = f"Producto {product_id} no encontrado en inventario"
                    break

                available = inv.quantity - inv.reserved
                if quantity > available:
                    failed = True
                    fail_reason = f"Stock insuficiente para producto {product_id}. Disponible: {available}"
                    break

                inv.reserved += quantity
                reserved.append({"product_id": product_id, "quantity": quantity})

            if failed:
                # Rollback — liberar lo reservado
                for r in reserved:
                    inv = db.query(Inventory).filter(
                        Inventory.product_id == r["product_id"]
                    ).first()
                    if inv:
                        inv.reserved -= r["quantity"]
                db.commit()

                await publish_event("inventory.failed", {
                    "order_id": order_id,
                    "reason": fail_reason,
                    "user_id": data.get("user_id"),
                    "email": data.get("email")
                })
                logger.info(f"Inventario fallido para orden #{order_id}: {fail_reason}")
            else:
                db.commit()
                await publish_event("inventory.reserved", {
                    "order_id": order_id,
                    "user_id": data.get("user_id"),
                    "email": data.get("email"),
                    "amount": data.get("total_amount"),
                    "items": items,
                    "reserved": reserved
                })
                logger.info(f"Stock reservado para orden #{order_id}")

    finally:
        db.close()


@app.on_event("startup")
async def startup():
    asyncio.create_task(subscribe_events(
        routing_keys=["order.created"],
        callback=handle_event,
        queue_name="inventory-service-queue"
    ))
    logger.info("Inventory Service escuchando eventos RabbitMQ")


@app.get("/")
def root():
    return {
        "service": "inventory-service",
        "version": "2.0.0",
        "events_published": ["inventory.reserved", "inventory.failed"],
        "events_consumed": ["order.created"]
    }