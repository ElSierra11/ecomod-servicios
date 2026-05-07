
import logging
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.aio_pika import AioPikaInstrumentor

logging.getLogger("opentelemetry").setLevel(logging.ERROR)

resource = Resource.create(attributes={
    SERVICE_NAME: "order-service"
})
provider = TracerProvider(resource=resource)
try:
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://jaeger:4317", insecure=True))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
except Exception as e:
    print(f"Telemetría no disponible: {e}")

try:
    from app.database import engine
    SQLAlchemyInstrumentor().instrument(engine=engine)
except Exception:
    pass

try:
    AioPikaInstrumentor().instrument()
except Exception:
    pass

from prometheus_fastapi_instrumentator import Instrumentator
import asyncio
import logging
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine, SessionLocal
from app.models import Base, Order, OrderStatus, OrderStatusHistory
from app.event_bus import subscribe_events, publish_event

logger = logging.getLogger(__name__)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Order Service",
    description="Microservicio de pedidos — Saga coreografiada con RabbitMQ",
    version="2.0.0"
)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

FastAPIInstrumentor.instrument_app(app)

app.include_router(router)


async def handle_event(event_type: str, data: dict):
    """Maneja eventos del bus de mensajes."""
    db = SessionLocal()
    try:
        #Escuchar payment.succeeded
        if event_type == "payment.succeeded":
            order_id = data.get("order_id")
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                order.status = OrderStatus.confirmed
                db.add(OrderStatusHistory(
                    order_id=order.id,
                    status=OrderStatus.confirmed,
                    comment="Pago confirmado — La orden ha sido validada automáticamente"
                ))
                db.commit()
                logger.info(f"✅ Orden #{order_id} confirmada por pago exitoso")
                
                # Publicar evento final (Notification Service lo escuchará)
                await publish_event("order.confirmed", {
                    "order_id": order.id,
                    "user_id": order.user_id,
                    "email": data.get("email", ""),
                    "total_amount": float(order.total_amount),
                    "status": "confirmed"
                })

        elif event_type == "shipping.confirmed":
            # Saga paso 5: Shipping confirmó — completar orden
            order_id = data.get("order_id")
            order = db.query(Order).filter(Order.id == order_id).first()
            if order and order.status != OrderStatus.confirmed:
                order.status = OrderStatus.confirmed
                db.add(OrderStatusHistory(
                    order_id=order.id,
                    status=OrderStatus.confirmed,
                    comment="Envío confirmado — Proceso de Saga completado"
                ))
                db.commit()
                logger.info(f"📦 Orden #{order_id} confirmada vía Shipping")

                # Publicar evento final (Notification Service lo escuchará)
                await publish_event("order.confirmed", {
                    "order_id": order.id,
                    "user_id": order.user_id,
                    "email": data.get("email", ""),
                    "total_amount": float(order.total_amount),
                    "status": "confirmed"
                })

        elif event_type == "inventory.failed":
            # Rollback: cancelar orden si no hay stock
            order_id = data.get("order_id")
            order = db.query(Order).filter(Order.id == order_id).first()
            if order and order.status == OrderStatus.pending:
                order.status = OrderStatus.cancelled
                reason = data.get('reason', 'Stock insuficiente')
                order.notes = f"Cancelada: {reason}"
                db.add(OrderStatusHistory(
                    order_id=order.id,
                    status=OrderStatus.cancelled,
                    comment=f"Saga Rollback: Inventario insuficiente. Motivo: {reason}"
                ))
                db.commit()
                logger.info(f"❌ Orden #{order_id} cancelada por falta de stock")

        elif event_type == "payment.failed":
            # Rollback: cancelar orden si falla el pago
            order_id = data.get("order_id")
            order = db.query(Order).filter(Order.id == order_id).first()
            if order and order.status == OrderStatus.pending:
                order.status = OrderStatus.cancelled
                reason = data.get('reason', 'Pago rechazado')
                order.notes = f"Cancelada: pago fallido — {reason}"
                db.add(OrderStatusHistory(
                    order_id=order.id,
                    status=OrderStatus.cancelled,
                    comment=f"Saga Rollback: Pago fallido. Motivo: {reason}"
                ))
                db.commit()
                logger.info(f"❌ Orden #{order_id} cancelada por pago fallido")

    finally:
        db.close()


async def cancel_expired_orders():
    """Busca órdenes pendientes que tengan más de 15 minutos y las cancela."""
    while True:
        try:
            db = SessionLocal()
            limit_time = datetime.utcnow() - timedelta(minutes=15)
            expired_orders = db.query(Order).filter(
                Order.status == OrderStatus.pending,
                Order.created_at <= limit_time
            ).all()

            for order in expired_orders:
                order.status = OrderStatus.cancelled
                order.notes = "Cancelada automáticamente por timeout de pago (15 min)"
                db.commit()
                logger.info(f"⏳ Orden #{order.id} cancelada por timeout")
                
                # Publicar evento para liberar inventario
                await publish_event("order.cancelled", {
                    "order_id": order.id,
                    "user_id": order.user_id,
                    "items": [{"product_id": item.product_id, "quantity": item.quantity} for item in order.items]
                })
            
            db.close()
        except Exception as e:
            logger.error(f"Error en cancel_expired_orders: {e}")
        
        await asyncio.sleep(60) # Revisar cada 60 segundos


@app.on_event("startup")
async def startup():
    asyncio.create_task(subscribe_events(
        routing_keys=[
            "payment.succeeded",   
            "shipping.confirmed", 
            "inventory.failed", 
            "payment.failed"
        ],
        callback=handle_event,
        queue_name="order-service-queue"
    ))
    asyncio.create_task(cancel_expired_orders())
    logger.info("Order Service escuchando eventos RabbitMQ: payment.succeeded, shipping.confirmed, inventory.failed, payment.failed")


@app.get("/")
def root():
    return {
        "service": "order-service",
        "version": "2.0.0",
        "saga": "coreografiada con RabbitMQ",
        "events_published": ["order.created", "order.confirmed"],
        "events_consumed": ["payment.succeeded", "shipping.confirmed", "inventory.failed", "payment.failed"]
    }