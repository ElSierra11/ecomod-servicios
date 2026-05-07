
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
    SERVICE_NAME: "cart-service"
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
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine
from app.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cart Service",
    description="Microservicio de carrito de compras — anónimo y autenticado",
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


@app.get("/")
def root():
    return {
        "service": "cart-service",
        "version": "1.0.0",
        "endpoints": [
            "POST   /cart/              — crear carrito",
            "GET    /cart/{id}          — obtener carrito por ID",
            "GET    /cart/user/{uid}    — carrito por usuario",
            "GET    /cart/anonymous/{t} — carrito anónimo por token",
            "POST   /cart/{id}/items    — agregar item",
            "PUT    /cart/{id}/items/{item_id} — actualizar cantidad",
            "DELETE /cart/{id}/items/{item_id} — quitar item",
            "DELETE /cart/{id}/items    — vaciar carrito",
            "POST   /cart/merge         — fusionar anónimo → usuario",
            "GET    /cart/health        — estado del servicio",
        ]
    }