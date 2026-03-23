from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


# ============= CART ITEMS =============

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    product_name: Optional[str] = None


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)


class CartItemResponse(BaseModel):
    id: int
    cart_id: int
    product_id: int
    product_name: Optional[str] = None
    unit_price: float
    quantity: int
    subtotal: float = 0.0
    added_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj):
        return cls(
            id=obj.id,
            cart_id=obj.cart_id,
            product_id=obj.product_id,
            product_name=obj.product_name,
            unit_price=obj.unit_price,
            quantity=obj.quantity,
            subtotal=round(obj.unit_price * obj.quantity, 2),
            added_at=obj.added_at,
        )


# ============= CART =============

class CartCreate(BaseModel):
    user_id: Optional[int] = None
    anonymous_token: Optional[str] = None


class CartResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    anonymous_token: Optional[str] = None
    items: List[CartItemResponse] = []
    total: float = 0.0
    total_items: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj):
        items = [CartItemResponse.model_validate(i) for i in obj.items]
        total = round(sum(i.subtotal for i in items), 2)
        total_items = sum(i.quantity for i in items)
        return cls(
            id=obj.id,
            user_id=obj.user_id,
            anonymous_token=obj.anonymous_token,
            items=items,
            total=total,
            total_items=total_items,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )


# ============= MERGE (anónimo → autenticado) =============

class CartMergeRequest(BaseModel):
    anonymous_token: str
    user_id: int


# ============= RESPUESTAS GENÉRICAS =============

class MessageResponse(BaseModel):
    message: str
    cart_id: Optional[int] = None
    item_id: Optional[int] = None