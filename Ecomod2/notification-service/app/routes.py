from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app import models, schemas
from app.mailer import (
    send_email,
    build_order_confirmed_email,
    build_payment_succeeded_email,
    build_payment_failed_email,
    build_shipment_created_email,
    build_shipment_delivered_email,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_and_send(db: Session, notif_data: dict, to_email: str, subject: str, body: str) -> models.Notification:
    """Helper: guarda la notificación y envía el email."""
    notif = models.Notification(**notif_data)
    db.add(notif)
    db.commit()
    db.refresh(notif)

    result = send_email(to_email, subject, body)

    notif.sent = result["success"]
    notif.sent_at = datetime.utcnow() if result["success"] else None
    notif.error = result.get("error")
    db.commit()
    db.refresh(notif)
    return notif



# HEALTH

@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "notification-service",
        "timestamp": datetime.utcnow().isoformat()
    }



# EVENTOS — DISPARADOS POR OTROS SERVICIOS

@router.post("/events/order-confirmed", response_model=schemas.NotificationResponse, status_code=201)
def on_order_confirmed(event: schemas.OrderConfirmedEvent, db: Session = Depends(get_db)):
    """Notifica al usuario cuando su orden es confirmada."""
    email_data = build_order_confirmed_email(event.order_id, event.total_amount, event.items_count)
    return save_and_send(
        db,
        {
            "user_id": event.user_id,
            "email": event.email,
            "type": "order_confirmed",
            "channel": "email",
            "subject": email_data["subject"],
            "body": email_data["body"],
            "reference_id": event.order_id,
            "reference_type": "order",
        },
        event.email,
        email_data["subject"],
        email_data["body"]
    )


@router.post("/events/payment-succeeded", response_model=schemas.NotificationResponse, status_code=201)
def on_payment_succeeded(event: schemas.PaymentSucceededEvent, db: Session = Depends(get_db)):
    """Notifica al usuario cuando su pago es exitoso."""
    email_data = build_payment_succeeded_email(event.order_id, event.amount, event.transaction_id)
    return save_and_send(
        db,
        {
            "user_id": event.user_id,
            "email": event.email,
            "type": "payment_succeeded",
            "channel": "email",
            "subject": email_data["subject"],
            "body": email_data["body"],
            "reference_id": event.payment_id,
            "reference_type": "payment",
        },
        event.email,
        email_data["subject"],
        email_data["body"]
    )


@router.post("/events/payment-failed", response_model=schemas.NotificationResponse, status_code=201)
def on_payment_failed(event: schemas.PaymentFailedEvent, db: Session = Depends(get_db)):
    """Notifica al usuario cuando su pago falla."""
    email_data = build_payment_failed_email(event.order_id, event.reason)
    return save_and_send(
        db,
        {
            "user_id": event.user_id,
            "email": event.email,
            "type": "payment_failed",
            "channel": "email",
            "subject": email_data["subject"],
            "body": email_data["body"],
            "reference_id": event.payment_id,
            "reference_type": "payment",
        },
        event.email,
        email_data["subject"],
        email_data["body"]
    )


@router.post("/events/shipment-created", response_model=schemas.NotificationResponse, status_code=201)
def on_shipment_created(event: schemas.ShipmentCreatedEvent, db: Session = Depends(get_db)):
    """Notifica al usuario cuando su envío es creado."""
    email_data = build_shipment_created_email(
        event.order_id, event.tracking_number,
        event.carrier, event.estimated_delivery or "Próximamente"
    )
    return save_and_send(
        db,
        {
            "user_id": event.user_id,
            "email": event.email,
            "type": "shipment_created",
            "channel": "email",
            "subject": email_data["subject"],
            "body": email_data["body"],
            "reference_id": event.shipment_id,
            "reference_type": "shipment",
        },
        event.email,
        email_data["subject"],
        email_data["body"]
    )


@router.post("/events/shipment-delivered", response_model=schemas.NotificationResponse, status_code=201)
def on_shipment_delivered(event: schemas.ShipmentDeliveredEvent, db: Session = Depends(get_db)):
    """Notifica al usuario cuando su pedido es entregado."""
    email_data = build_shipment_delivered_email(event.order_id, event.tracking_number)
    return save_and_send(
        db,
        {
            "user_id": event.user_id,
            "email": event.email,
            "type": "shipment_delivered",
            "channel": "email",
            "subject": email_data["subject"],
            "body": email_data["body"],
            "reference_id": event.shipment_id,
            "reference_type": "shipment",
        },
        event.email,
        email_data["subject"],
        email_data["body"]
    )


# CRUD NOTIFICACIONES

@router.post("/", response_model=schemas.NotificationResponse, status_code=201)
def create_notification(body: schemas.NotificationCreate, db: Session = Depends(get_db)):
    """Crea y envía una notificación manual."""
    to_email = body.email or ""
    subject = body.subject or "Notificación de EcoMod"
    result = send_email(to_email, subject, body.body)

    notif = models.Notification(
        **body.model_dump(),
        sent=result["success"],
        sent_at=datetime.utcnow() if result["success"] else None,
        error=result.get("error"),
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.get("/user/{user_id}", response_model=List[schemas.NotificationResponse])
def get_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.created_at.desc()).all()


@router.get("/", response_model=List[schemas.NotificationResponse])
def get_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Notification).order_by(
        models.Notification.created_at.desc()
    ).offset(skip).limit(limit).all()