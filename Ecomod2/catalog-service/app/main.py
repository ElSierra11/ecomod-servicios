from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine
from app.models import Base
from datetime import datetime

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Catalog Service",
    description="Microservicio de catálogo de productos",
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
    return {
        "service": "catalog running",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "catalog-service"
    }