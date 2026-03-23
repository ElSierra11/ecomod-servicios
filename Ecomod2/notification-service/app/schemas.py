from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class NotificationCreate(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    type: str
    channel: str = "email"
    subject: Optional[str] = None
    body: str
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    email: Optional[str] = None
    type: str
    channel: str
    subject: Optional[str] = None
    body: str
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    sent: bool
    sent_at: Optional[datetime] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Eventos que disparan notificaciones automáticas
class OrderConfirmedEvent(BaseModel):
    order_id: int
    user_id: int
    email: str
    total_amount: float
    items_count: int


class PaymentSucceededEvent(BaseModel):
    payment_id: int
    order_id: int
    user_id: int
    email: str
    amount: float
    transaction_id: str


class PaymentFailedEvent(BaseModel):
    payment_id: int
    order_id: int
    user_id: int
    email: str
    reason: str


class ShipmentCreatedEvent(BaseModel):
    shipment_id: int
    order_id: int
    user_id: int
    email: str
    tracking_number: str
    carrier: str
    estimated_delivery: Optional[str] = None


class ShipmentDeliveredEvent(BaseModel):
    shipment_id: int
    order_id: int
    user_id: int
    email: str
    tracking_number: str