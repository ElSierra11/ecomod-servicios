from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine
from app.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Payment Service",
    description="Microservicio de pagos — integración con pasarela externa (simulada)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "payment-service",
        "version": "1.0.0",
        "gateway": "simulada (Stripe/PayPal en producción)",
        "endpoints": [
            "POST   /payments/              — procesar pago + Saga",
            "GET    /payments/              — listar todos",
            "GET    /payments/{id}          — obtener por ID",
            "GET    /payments/order/{id}    — pagos por orden",
            "GET    /payments/user/{id}     — pagos por usuario",
            "POST   /payments/{id}/refund   — reembolso",
            "GET    /payments/health        — estado del servicio",
        ]
    }