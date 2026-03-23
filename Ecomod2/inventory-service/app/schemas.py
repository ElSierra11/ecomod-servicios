from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

# Base
class InventoryBase(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., ge=0)

# Crear/Actualizar
class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)

# Respuesta
class InventoryResponse(InventoryBase):
    id: int
    reserved: int
    available: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Operaciones de reserva
class ReserveRequest(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)

class ReserveResponse(BaseModel):
    success: bool
    product_id: int
    reserved: int
    remaining: int
    message: str

class MessageResponse(BaseModel):
    message: str
    product_id: Optional[int] = None