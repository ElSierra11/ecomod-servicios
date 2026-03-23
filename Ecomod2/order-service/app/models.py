from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    shipped = "shipped"
    delivered = "delivered"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    # Usuario que hizo la orden
    user_id = Column(Integer, nullable=False, index=True)

    # Referencia al carrito origen (solo referencia, sin FK real)
    cart_id = Column(Integer, nullable=True)

    # Estado del ciclo de vida
    status = Column(String, default=OrderStatus.pending, nullable=False)

    # Total calculado al momento de crear
    total_amount = Column(Float, nullable=False, default=0.0)

    # Notas adicionales
    notes = Column(String, nullable=True)

    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación con items
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)

    # Snapshot del producto al momento del pedido
    product_id = Column(Integer, nullable=False)
    product_name = Column(String, nullable=True)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)

    # Relación inversa
    order = relationship("Order", back_populates="items")