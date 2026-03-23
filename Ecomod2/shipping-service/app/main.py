from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine
from app.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Shipping Service",
    description="Microservicio de envíos — logística y tracking",
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
        "service": "shipping-service",
        "version": "1.0.0",
        "carriers": ["Servientrega", "Interrapidísimo", "Coordinadora", "TCC", "Deprisa"],
        "endpoints": [
            "POST   /shipping/              — crear envío",
            "GET    /shipping/              — listar todos",
            "GET    /shipping/{id}          — obtener por ID",
            "GET    /shipping/order/{id}    — envío por orden",
            "GET    /shipping/user/{id}     — envíos por usuario",
            "GET    /shipping/tracking/{n}  — buscar por tracking",
            "PATCH  /shipping/{id}/status   — actualizar estado",
            "GET    /shipping/calculate     — calcular costo",
            "GET    /shipping/rates         — tarifas disponibles",
            "GET    /shipping/health        — estado del servicio",
        ]
    }