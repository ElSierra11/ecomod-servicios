from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    # Referencia a la orden (sin FK real — microservicios desacoplados)
    order_id = Column(Integer, nullable=False, index=True)

    # Usuario que paga
    user_id = Column(Integer, nullable=False, index=True)

    # Monto
    amount = Column(Float, nullable=False)

    # Estado: pending, succeeded, failed, refunded
    status = Column(String, default="pending", nullable=False)

    # Método de pago: card, paypal, nequi, daviplata
    payment_method = Column(String, nullable=False, default="card")

    # Token de transacción (simulado — en producción sería Stripe charge ID)
    transaction_id = Column(String, nullable=True, unique=True)

    # Razón del fallo si aplica
    failure_reason = Column(String, nullable=True)

    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())