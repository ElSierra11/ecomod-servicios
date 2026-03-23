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