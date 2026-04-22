from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from datetime import datetime


# ─── Métodos de pago permitidos ───────────────────────────────────────────────
PAYMENT_METHODS = Literal["card_stripe", "paypal"]


# ─── Datos de envío opcionales (para encadenar Saga automáticamente) ──────────
class ShippingData(BaseModel):
    recipient_name: str
    address:        str
    city:           str
    department:     str
    postal_code:    Optional[str] = ""
    country:        Optional[str] = "Colombia"
    carrier:        Optional[str] = "Servientrega"


# ─── Items de la orden (compensación si el pago falla) ───────────────────────
class OrderItemRef(BaseModel):
    product_id: int
    quantity:   int


# ─── Crear pago ───────────────────────────────────────────────────────────────
class PaymentCreate(BaseModel):
    order_id:       int
    user_id:        int
    amount:         float = Field(..., gt=0, description="Monto en COP")
    payment_method: PAYMENT_METHODS = Field(
        default="card_stripe",
        description="Método de pago: card_stripe o paypal",
    )
    email:          Optional[str] = None
    # Datos opcionales para encadenar envío automáticamente tras pago exitoso
    shipping:       Optional[ShippingData] = None
    # Items para liberar stock si el pago falla (compensación Saga)
    order_items:    Optional[List[OrderItemRef]] = None


# ─── Respuesta de pago ────────────────────────────────────────────────────────
class PaymentResponse(BaseModel):
    id:             int
    order_id:       int
    user_id:        int
    amount:         float
    status:         str
    payment_method: str
    transaction_id: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at:     Optional[datetime] = None
    updated_at:     Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Reembolso ────────────────────────────────────────────────────────────────
class PaymentRefundRequest(BaseModel):
    reason: Optional[str] = "Reembolso solicitado por el cliente"