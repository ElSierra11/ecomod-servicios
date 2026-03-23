from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine
from app.models import Base

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

# el include_router de la primera se perdía. Ahora solo hay una instancia.
app = FastAPI(
    title="Auth Service",
    description="Microservicio de autenticación — registro, login, JWT",
    version="1.0.0"
)

# CORS ausente en auth-service. El frontend no podía llamarlo directamente.
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
    return {"service": "auth running"}