
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
    SERVICE_NAME: "notification-service"
})
provider = TracerProvider(resource=resource)
# Omitir telemetría en producción
# processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://jaeger:4317", insecure=True))
# provider.add_span_processor(processor)
# trace.set_tracer_provider(provider)

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
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router, save_and_send
from app.database import engine, SessionLocal
from app.models import Base
from app.event_bus import subscribe_events
from app.mailer import (
    build_order_confirmed_email,
    build_payment_succeeded_email,
    build_payment_failed_email,
    build_shipment_created_email,
)

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Notification Service",
    description="Microservicio de notificaciones — emails y eventos",
    version="1.0.0"
)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FastAPIInstrumentor.instrument_app(app)

app.include_router(router)


async def handle_event(event_type: str, data: dict):
    """Maneja eventos del bus de mensajes para enviar notificaciones asíncronas."""
    db = SessionLocal()
    try:
        user_id = data.get("user_id")
        email = data.get("email")

        if not email or not user_id:
            logger.warning(f"No hay email o user_id en el evento {event_type}. Ignorando.")
            return

        if event_type == "order.confirmed":
            order_id = data.get("order_id")
            total = data.get("total_amount", 0) # Asumir que se envia o buscarlo
            # Mejor buscar total si no viene
            email_data = build_order_confirmed_email(order_id, total, 1) # cantidad simplificada si no viene
            save_and_send(
                db,
                {
                    "user_id": user_id, "email": email, "type": "order_confirmed",
                    "channel": "email", "subject": email_data["subject"], "body": email_data["body"],
                    "reference_id": order_id, "reference_type": "order",
                },
                email, email_data["subject"], email_data["body"]
            )
            logger.info(f"Notificación order.confirmed enviada para orden #{order_id}")

        elif event_type == "payment.succeeded":
            order_id = data.get("order_id")
            amount = data.get("amount", 0)
            txn_id = data.get("transaction_id", "N/A")
            payment_id = data.get("payment_id", order_id)
            email_data = build_payment_succeeded_email(order_id, amount, txn_id)
            save_and_send(
                db,
                {
                    "user_id": user_id, "email": email, "type": "payment_succeeded",
                    "channel": "email", "subject": email_data["subject"], "body": email_data["body"],
                    "reference_id": payment_id, "reference_type": "payment",
                },
                email, email_data["subject"], email_data["body"]
            )
            logger.info(f"Notificación payment.succeeded enviada para orden #{order_id}")

        elif event_type == "payment.failed":
            order_id = data.get("order_id")
            reason = data.get("reason", "Pago rechazado")
            payment_id = data.get("payment_id", order_id)
            email_data = build_payment_failed_email(order_id, reason)
            save_and_send(
                db,
                {
                    "user_id": user_id, "email": email, "type": "payment_failed",
                    "channel": "email", "subject": email_data["subject"], "body": email_data["body"],
                    "reference_id": payment_id, "reference_type": "payment",
                },
                email, email_data["subject"], email_data["body"]
            )
            logger.info(f"Notificación payment.failed enviada para orden #{order_id}")

        elif event_type == "shipping.confirmed":
            order_id = data.get("order_id")
            tracking = data.get("tracking_number", "")
            carrier = data.get("carrier", "")
            shipment_id = data.get("shipment_id", order_id)
            email_data = build_shipment_created_email(order_id, tracking, carrier, "Próximamente")
            save_and_send(
                db,
                {
                    "user_id": user_id, "email": email, "type": "shipment_created",
                    "channel": "email", "subject": email_data["subject"], "body": email_data["body"],
                    "reference_id": shipment_id, "reference_type": "shipment",
                },
                email, email_data["subject"], email_data["body"]
            )
            logger.info(f"Notificación shipping.confirmed enviada para orden #{order_id}")

    except Exception as e:
        logger.error(f"Error enviando notificación para {event_type}: {e}")
    finally:
        db.close()


@app.on_event("startup")
async def startup():
    asyncio.create_task(subscribe_events(
        routing_keys=[
            "order.confirmed",
            "payment.succeeded",
            "payment.failed",
            "shipping.confirmed"
        ],
        callback=handle_event,
        queue_name="notification-service-queue"
    ))
    logger.info("Notification Service escuchando eventos RabbitMQ")


@app.get("/")
def root():
    return {
        "service": "notification-service",
        "version": "1.0.0",
        "channels": ["email"],
        "events": [
            "order_confirmed",
            "payment_succeeded",
            "payment_failed",
            "shipment_created",
            "shipment_delivered",
        ],
        "endpoints": [
            "POST /notifications/events/order-confirmed",
            "POST /notifications/events/payment-succeeded",
            "POST /notifications/events/payment-failed",
            "POST /notifications/events/shipment-created",
            "POST /notifications/events/shipment-delivered",
            "POST /notifications/              — notificación manual",
            "GET  /notifications/user/{id}     — por usuario",
            "GET  /notifications/              — listar todas",
            "GET  /notifications/health        — estado",
        ]
    }