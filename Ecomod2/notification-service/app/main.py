from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine
from app.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Notification Service",
    description="Microservicio de notificaciones — emails y eventos",
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
        "service": "notification-service",
        "version": "1.0.0",
        "channels": ["email"],
        "events": [
            "order_confirmed",
            "payment_succeeded",
            "payment_failed",
            "shipment_created",
            "shipment_delivered",
        ],
        "endpoints": [
            "POST /notifications/events/order-confirmed",
            "POST /notifications/events/payment-succeeded",
            "POST /notifications/events/payment-failed",
            "POST /notifications/events/shipment-created",
            "POST /notifications/events/shipment-delivered",
            "POST /notifications/              — notificación manual",
            "GET  /notifications/user/{id}     — por usuario",
            "GET  /notifications/              — listar todas",
            "GET  /notifications/health        — estado",
        ]
    }