
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
    SERVICE_NAME: "payment-service"
})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://jaeger:4317", insecure=True))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

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
from app.routes import router
from app.database import engine, SessionLocal
from app.models import Base, Payment
from app.event_bus import subscribe_events
from app.notifier import notify_payment_succeeded, notify_payment_failed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Payment Service",
    description="Microservicio de pagos — Stripe & PayPal — Saga coreografiada",
    version="2.1.0",
)

# CORS
Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
FastAPIInstrumentor.instrument_app(app)

app.include_router(router)


# Manejador de eventos de RabbitMQ
async def handle_event(event_type: str, data: dict):

    db = SessionLocal()
    try:
        if event_type == "inventory.reserved":
            order_id = data.get("order_id")
            user_id = data.get("user_id")
            amount = data.get("amount", 0)

            logger.info(f"📦 Evento inventory.reserved recibido para orden #{order_id} - Monto: {amount}")
            logger.info(f"💰 Orden #{order_id} lista para pago - El usuario puede elegir Stripe o PayPal")
            logger.info(f"💡 El pago se creará cuando el usuario seleccione un método en el frontend")

            
            # El pago se creará cuando el usuario elija Stripe o PayPal

    except Exception as e:
        logger.error(f"Error en handle_event: {e}")
    finally:
        db.close()


# Eventos de startup y shutdown
@app.on_event("startup")
async def startup():
    logger.info("🚀 Iniciando Payment Service...")
    
    # Intentar suscribirse a RabbitMQ si está configurado
    try:
        asyncio.create_task(
            subscribe_events(
                routing_keys=["inventory.reserved"],
                callback=handle_event,
                queue_name="payment-service-queue",
            )
        )
        logger.info("✅ Payment Service escuchando eventos RabbitMQ → inventory.reserved")
    except Exception as e:
        logger.warning(f"⚠️ No se pudo conectar a RabbitMQ: {e}")
        logger.info("Continuando sin eventos asíncronos - solo modo API directa")


@app.on_event("shutdown")
async def shutdown():
    logger.info("🛑 Cerrando Payment Service...")


@app.get("/")
def root():
    return {
        "service": "payment-service",
        "version": "2.1.0",
        "payment_methods": ["card_stripe", "paypal"],
        "events_published": ["payment.succeeded", "payment.failed"],
        "events_consumed": ["inventory.reserved"],
        "endpoints": {
            "stripe": ["/payments/stripe/create-intent", "/payments/stripe/confirm"],
            "paypal": ["/payments/paypal/create", "/payments/paypal/execute"],
            "queries": ["/payments/", "/payments/{id}", "/payments/order/{order_id}", "/payments/user/{user_id}"],
            "crud": ["POST /payments/", "POST /payments/{id}/refund"],
        },
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "payment-service"}