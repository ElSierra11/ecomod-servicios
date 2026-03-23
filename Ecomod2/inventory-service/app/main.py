from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import Base, engine
from app.models import Inventory

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory Service",
    description="Microservicio de inventario para gestión de stock",
    version="1.0.0"
)

# CORS
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
    return {"service": "inventory running", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "inventory-service"}