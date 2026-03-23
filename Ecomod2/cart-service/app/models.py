from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)

    # Usuario autenticado (opcional — null si es anónimo)
    user_id = Column(Integer, nullable=True, index=True)

    # Token para carritos anónimos (null si está autenticado)
    anonymous_token = Column(String, nullable=True, unique=True, index=True)

    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación con items
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False, index=True)

    # Referencia al producto en catalog-service (sin FK real — microservicios desacoplados)
    product_id = Column(Integer, nullable=False)

    # Snapshot del precio al momento de agregar
    unit_price = Column(Float, nullable=False)

    # Nombre snapshot para mostrarlo sin consultar catalog
    product_name = Column(String, nullable=True)

    quantity = Column(Integer, nullable=False, default=1)

    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relación inversa
    cart = relationship("Cart", back_populates="items")