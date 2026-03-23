from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class PaymentCreate(BaseModel):
    order_id: int
    user_id: int
    amount: float = Field(..., gt=0)
    payment_method: str = Field(default="card")


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    user_id: int
    amount: float
    status: str
    payment_method: str
    transaction_id: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaymentRefundRequest(BaseModel):
    reason: Optional[str] = "Reembolso solicitado por el usuario"


class MessageResponse(BaseModel):
    message: str
    payment_id: Optional[int] = None
    transaction_id: Optional[str] = None