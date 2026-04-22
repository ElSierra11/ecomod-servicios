from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OrderConfirmedEvent(BaseModel):
    order_id:     int
    user_id:      int
    email:        str
    total_amount: float
    items_count:  int


# FIX: evento propio para cancelación de orden
class OrderCancelledEvent(BaseModel):
    order_id: int
    user_id:  int
    email:    str
    reason:   str


class PaymentSucceededEvent(BaseModel):
    payment_id:     int
    order_id:       int
    user_id:        int
    email:          str
    amount:         float
    transaction_id: str


class PaymentFailedEvent(BaseModel):
    payment_id: int
    order_id:   int
    user_id:    int
    email:      str
    reason:     str


class ShipmentCreatedEvent(BaseModel):
    shipment_id:        int
    order_id:           int
    user_id:            int
    email:              str
    tracking_number:    str
    carrier:            str
    estimated_delivery: Optional[str] = None


class ShipmentDeliveredEvent(BaseModel):
    shipment_id:     int
    order_id:        int
    user_id:         int
    email:           str
    tracking_number: str


class NotificationCreate(BaseModel):
    user_id:        int
    email:          Optional[str] = None
    type:           str
    channel:        str = "email"
    subject:        Optional[str] = None
    body:           str
    reference_id:   Optional[int] = None
    reference_type: Optional[str] = None


class NotificationResponse(BaseModel):
    id:             int
    user_id:        int
    email:          Optional[str] = None
    type:           str
    channel:        str
    subject:        Optional[str] = None
    body:           str
    sent:           bool = False
    sent_at:        Optional[datetime] = None
    error:          Optional[str] = None
    reference_id:   Optional[int] = None
    reference_type: Optional[str] = None
    created_at:     Optional[datetime] = None

    class Config:
        from_attributes = True