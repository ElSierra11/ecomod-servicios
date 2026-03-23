from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)

    # Datos de autenticación
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)  # Agregado
    password = Column(String, nullable=False)

    # Rol del usuario
    role = Column(String, default="cliente")

    # Estado del usuario
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Agregado

    # Datos personales
    nombre = Column(String, nullable=True)
    apellido = Column(String, nullable=True)
    telefono = Column(String, nullable=True)

    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    last_login = Column(DateTime, nullable=True)