from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    # Destinatario
    user_id = Column(Integer, nullable=True, index=True)
    email = Column(String, nullable=True)

    # Tipo: order_confirmed, payment_succeeded, payment_failed,
    #       shipment_created, shipment_delivered, password_reset, welcome
    type = Column(String, nullable=False, index=True)

    # Canal: email, push, sms
    channel = Column(String, default="email", nullable=False)

    # Contenido
    subject = Column(String, nullable=True)
    body = Column(Text, nullable=False)

    # Referencia al recurso relacionado
    reference_id = Column(Integer, nullable=True)    # order_id, payment_id, etc.
    reference_type = Column(String, nullable=True)   # "order", "payment", "shipment"

    # Estado
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(String, nullable=True)

    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())