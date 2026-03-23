from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


# ============= ORDER ITEMS =============

class OrderItemCreate(BaseModel):
    product_id: int
    product_name: Optional[str] = None
    unit_price: float = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    product_name: Optional[str] = None
    unit_price: float
    quantity: int
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


# ============= ORDER =============

class OrderCreate(BaseModel):
    user_id: int
    cart_id: Optional[int] = None
    items: List[OrderItemCreate]
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|cancelled|shipped|delivered)$")


class OrderResponse(BaseModel):
    id: int
    user_id: int
    cart_id: Optional[int] = None
    status: str
    total_amount: float
    notes: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============= SAGA EVENTS =============

class InventoryReserveRequest(BaseModel):
    product_id: int
    quantity: int


class InventoryReserveResponse(BaseModel):
    success: bool
    product_id: int
    reserved: int
    remaining: int
    message: str


# ============= RESPUESTAS GENÉRICAS =============

class MessageResponse(BaseModel):
    message: str
    order_id: Optional[int] = None