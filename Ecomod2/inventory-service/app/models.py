from sqlalchemy import Column, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False, unique=True, index=True)  # único por producto
    quantity = Column(Integer, nullable=False, default=0)  # stock total
    reserved = Column(Integer, nullable=False, default=0)  # stock reservado (para pedidos en proceso)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    @property
    def available(self):
        """Stock disponible (total - reservado)"""
        return self.quantity - self.reserved