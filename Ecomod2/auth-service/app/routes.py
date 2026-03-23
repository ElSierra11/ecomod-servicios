from fastapi import APIRouter, HTTPException, Depends, status, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import httpx
import os

from app.database import SessionLocal
from app.models import User
from app.schemas import (
    UserCreate, UserLogin, RefreshTokenRequest,
    PasswordChangeRequest, UserResponse, TokenResponse
)
from app.security import hash_password, verify_password
from app.auth import create_access_token, create_refresh_token, verify_token
from jose import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "ecomod_secret_dev")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8007")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = verify_token(token, token_type="access")
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token", headers={"WWW-Authenticate": "Bearer"})
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive")
    return user


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if user.username and db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
    new_user = User(
        email=user.email, username=user.username, nombre=user.nombre,
        apellido=user.apellido, password=hash_password(user.password),
        role="cliente", is_active=True, is_verified=False, created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id, "email": new_user.email}


@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})
    if not db_user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive")
    db_user.last_login = datetime.utcnow()
    db.commit()
    access_token = create_access_token({"user_id": db_user.id, "role": db_user.role, "email": db_user.email})
    refresh_token = create_refresh_token({"user_id": db_user.id})
    return TokenResponse(
        access_token=access_token, refresh_token=refresh_token, token_type="bearer",
        user=UserResponse(id=db_user.id, email=db_user.email, username=db_user.username,
            role=db_user.role, nombre=db_user.nombre, apellido=db_user.apellido,
            is_active=db_user.is_active, created_at=db_user.created_at)
    )


@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = verify_token(request.refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = db.query(User).filter(User.id == payload.get("user_id"), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return {"access_token": create_access_token({"user_id": user.id, "role": user.role, "email": user.email}), "token_type": "bearer"}


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, email=current_user.email, username=current_user.username,
        role=current_user.role, nombre=current_user.nombre, apellido=current_user.apellido,
        is_active=current_user.is_active, created_at=current_user.created_at)


@router.post("/change-password")
def change_password(request: PasswordChangeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(request.current_password, current_user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_user.password = hash_password(request.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully", "user_id": current_user.id}


@router.get("/verify-token")
def verify_user_token(current_user: User = Depends(get_current_user)):
    return {"valid": True, "user_id": current_user.id, "email": current_user.email, "role": current_user.role}


@router.get("/users/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return get_profile(current_user)


# ─────────────────────────────────────────
# RECUPERACIÓN DE CONTRASEÑA
# ─────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(body: dict = Body(...), db: Session = Depends(get_db)):
    """
    Paso 1: el usuario ingresa su email.
    Genera un token temporal de 15 minutos y envía el email de recuperación.
    Siempre responde igual para no revelar si el email existe.
    """
    email = body.get("email", "").strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if user:
        # Generar token de reset (válido 15 min)
        reset_token = jwt.encode(
            {
                "user_id": user.id,
                "email": user.email,
                "type": "password_reset",
                "exp": datetime.utcnow() + timedelta(minutes=15)
            },
            SECRET_KEY,
            algorithm=ALGORITHM
        )

        # Enviar email via notification-service
        reset_link = f"http://localhost:3001/reset-password?token={reset_token}"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{NOTIFICATION_SERVICE_URL}/notifications/",
                    json={
                        "user_id": user.id,
                        "email": user.email,
                        "type": "password_reset",
                        "channel": "email",
                        "subject": "🔐 Recuperación de contraseña — EcoMod",
                        "body": f"""
                        <h2>Recuperación de contraseña</h2>
                        <p>Hola {user.nombre or user.email},</p>
                        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                        <p>Haz clic en el siguiente enlace (válido por 15 minutos):</p>
                        <p><a href="{reset_link}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
                           Restablecer contraseña
                        </a></p>
                        <p>Si no solicitaste esto, ignora este mensaje.</p>
                        <p>— Equipo EcoMod</p>
                        """,
                        "reference_id": user.id,
                        "reference_type": "user"
                    }
                )
        except Exception:
            pass  # No bloquear si el servicio de notificaciones falla

    # Siempre responder igual para no revelar si el email existe
    return {"message": "Si el email existe en el sistema, recibirás un enlace de recuperación."}


@router.post("/reset-password")
async def reset_password(body: dict = Body(...), db: Session = Depends(get_db)):
    """
    Paso 2: el usuario ingresa el token del email y su nueva contraseña.
    Valida el token y actualiza la contraseña.
    """
    token = body.get("token", "")
    new_password = body.get("new_password", "")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "password_reset":
            raise HTTPException(status_code=400, detail="Token inválido")

        user = db.query(User).filter(User.id == payload.get("user_id")).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        user.password = hash_password(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()

        return {"message": "Contraseña actualizada correctamente. Ya puedes iniciar sesión."}

    except Exception as e:
        if "expired" in str(e).lower():
            raise HTTPException(status_code=400, detail="El enlace ha expirado. Solicita uno nuevo.")
        raise HTTPException(status_code=400, detail="Token inválido o expirado")


@router.get("/health")
def health():
    return {"status": "healthy", "service": "auth-service", "timestamp": datetime.utcnow().isoformat()}


@router.get("/")
def root():
    return {
        "service": "Auth Service", "version": "1.0.0",
        "endpoints": [
            "/auth/register (POST)", "/auth/login (POST)",
            "/auth/refresh (POST)", "/auth/profile (GET)",
            "/auth/change-password (POST)", "/auth/forgot-password (POST)",
            "/auth/reset-password (POST)", "/auth/logout (POST)",
            "/auth/verify-token (GET)", "/auth/health (GET)"
        ]
    }