from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine
from app.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Order Service",
    description="Microservicio de pedidos — Saga coreografiada con inventory-service",
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
        "service": "order-service",
        "version": "1.0.0",
        "saga": "coreografiada con inventory-service",
        "endpoints": [
            "POST   /orders/              — crear orden + Saga",
            "GET    /orders/              — listar todas",
            "GET    /orders/{id}          — obtener por ID",
            "GET    /orders/user/{uid}    — órdenes por usuario",
            "PATCH  /orders/{id}/status   — actualizar estado",
            "GET    /orders/health        — estado del servicio",
        ]
    }