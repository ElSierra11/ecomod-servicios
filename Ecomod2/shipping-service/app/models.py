from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)

    # Referencia a la orden 
    order_id = Column(Integer, nullable=False, index=True, unique=True)
    user_id = Column(Integer, nullable=False, index=True)

    # Destino
    recipient_name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    department = Column(String, nullable=False)
    postal_code = Column(String, nullable=True)
    country = Column(String, default="Colombia")

    # Logística
    carrier = Column(String, default="Servientrega")  # Servientrega, Interrapidísimo, etc.
    tracking_number = Column(String, nullable=True, unique=True)
    shipping_cost = Column(Float, nullable=False, default=0.0)

    # Estado
    status = Column(String, default="pending", nullable=False)

    # Fechas estimadas
    estimated_delivery = Column(DateTime(timezone=True), nullable=True)

    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())