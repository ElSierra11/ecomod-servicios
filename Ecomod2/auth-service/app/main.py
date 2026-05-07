
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
    SERVICE_NAME: "auth-service"
})
provider = TracerProvider(resource=resource)
# Telemetría (Opcional: No crashea si Jaeger no está disponible)
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
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine
from app.models import Base

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

# include_router 
app = FastAPI(
    title="Auth Service",
    description="Microservicio de autenticación — registro, login, JWT",
    version="1.0.0"
)

# CORS .
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
    return {"service": "auth running"}