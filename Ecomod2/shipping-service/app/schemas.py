from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class ShipmentCreate(BaseModel):
    order_id: int
    user_id: int
    recipient_name: str = Field(..., min_length=2)
    address: str = Field(..., min_length=5)
    city: str = Field(..., min_length=2)
    department: str = Field(..., min_length=2)
    postal_code: Optional[str] = None
    country: str = "Colombia"
    carrier: str = "Servientrega"


class ShipmentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|processing|shipped|in_transit|delivered|returned)$")


class ShipmentResponse(BaseModel):
    id: int
    order_id: int
    user_id: int
    recipient_name: str
    address: str
    city: str
    department: str
    postal_code: Optional[str] = None
    country: str
    carrier: str
    tracking_number: Optional[str] = None
    shipping_cost: float
    status: str
    estimated_delivery: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ShippingCostResponse(BaseModel):
    city: str
    department: str
    carrier: str
    cost: float
    estimated_days: int