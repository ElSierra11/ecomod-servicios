from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List  # 👈 Agrega List si no está
from datetime import datetime

# ============================================================
# AUTENTICACIÓN Y USUARIOS
# ============================================================

class UserCreate(BaseModel):
    email: EmailStr
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    password: str = Field(..., min_length=8)
    nombre: Optional[str] = None
    apellido: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: Optional[str] = None
    role: str
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

# ============================================================
# ADMINISTRACIÓN DE USUARIOS (SOLO ADMIN)
# ============================================================

class RoleUpdate(BaseModel):
    """Esquema para actualizar el rol de un usuario"""
    role: str = Field(..., pattern="^(admin|cliente)$", description="Rol del usuario: 'admin' o 'cliente'")

class UserStatusUpdate(BaseModel):
    """Esquema para activar/desactivar un usuario"""
    is_active: bool = Field(..., description="True para activar, False para desactivar")

class UserStatsResponse(BaseModel):
    """Estadísticas de usuarios (solo admin)"""
    total: int
    active: int
    inactive: int
    admins: int
    clients: int