# EcoMod - Versión Limpia para Despliegue
from typing import List
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
    PasswordChangeRequest, UserResponse, TokenResponse,
    RoleUpdate, UserStatusUpdate, UserStatsResponse
)
from app.security import hash_password, verify_password
from app.auth import create_access_token, create_refresh_token, verify_token
from jose import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "ecomod_secret_dev")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8007")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")


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


# ══════════════════════════════════════════════════════════════════════════════
# GOOGLE OAUTH
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/google")
async def google_auth(body: dict = Body(...), db: Session = Depends(get_db)):
    """
    Recibe el credential JWT de Google Identity Services,
    lo verifica con la API de Google, busca o crea el usuario,
    y devuelve tokens JWT propios de EcoMod.
    """
    credential = body.get("credential", "")
    if not credential:
        raise HTTPException(status_code=400, detail="Google credential requerido")

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID no configurado en el servidor")

    # ── Verificar el token con Google ────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # The frontend is sending an access_token, not an id_token
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {credential}"}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Token de Google inválido")

            google_data = response.json()
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="No se pudo contactar con Google para verificar el token")

    # ── Validar respuesta de Google ──────────────────────────────────────────
    # El endpoint userinfo no devuelve "aud", así que solo verificamos errores.
    # El hecho de que Google devolvió 200 con datos válidos ya es validación suficiente.
    if google_data.get("error"):
        raise HTTPException(status_code=401, detail=f"Token de Google rechazado: {google_data.get('error_description', '')}")

    # ── Extraer datos del usuario de Google ──────────────────────────────────
    google_email  = google_data.get("email", "").lower().strip()
    google_name   = google_data.get("given_name", "")
    google_last   = google_data.get("family_name", "")
    google_sub    = google_data.get("sub", "")   # ID único de Google
    # userinfo returns boolean for email_verified, id_token returns string or boolean
    email_verified_raw = google_data.get("email_verified", False)
    email_verified = email_verified_raw is True or str(email_verified_raw).lower() == "true"

    if not google_email:
        raise HTTPException(status_code=400, detail="No se pudo obtener el email de Google")

    # ── Buscar o crear usuario ────────────────────────────────────────────────
    user = db.query(User).filter(User.email == google_email).first()

    if user:
        # Usuario existente — actualizar last_login
        user.last_login = datetime.utcnow()
        # Si el email de Google está verificado, marcar como verificado
        if email_verified and not user.is_verified:
            user.is_verified = True
        db.commit()
    else:
        # Usuario nuevo — crear automáticamente
        # Generar username único a partir del email
        base_username = google_email.split("@")[0]
        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1

        user = User(
            email=google_email,
            username=username,
            nombre=google_name or google_email.split("@")[0],
            apellido=google_last or "",
            # Contraseña vacía — usuario de Google no puede hacer login con password
            password=hash_password(f"google_{google_sub}_oauth"),
            role="cliente",
            is_active=True,
            is_verified=email_verified,
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Tu cuenta está desactivada. Contacta al soporte.")

    # ── Generar tokens propios de EcoMod ─────────────────────────────────────
    access_token  = create_access_token({"user_id": user.id, "role": user.role, "email": user.email})
    refresh_token = create_refresh_token({"user_id": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            nombre=user.nombre,
            apellido=user.apellido,
            is_active=user.is_active,
            created_at=user.created_at,
        )
    )


# ══════════════════════════════════════════════════════════════════════════════
# RESTO DE ENDPOINTS (sin cambios)
# ══════════════════════════════════════════════════════════════════════════════

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


@router.put("/profile")
def update_profile(body: dict = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    allowed = ["nombre", "apellido", "username"]
    for field in allowed:
        if field in body:
            setattr(current_user, field, body[field])
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
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


# ── Recuperación de contraseña ────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(body: dict = Body(...), db: Session = Depends(get_db)):
    email = body.get("email", "").strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user:
        reset_token = jwt.encode(
            {"user_id": user.id, "email": user.email, "type": "password_reset",
             "exp": datetime.utcnow() + timedelta(minutes=15)},
            SECRET_KEY, algorithm=ALGORITHM
        )
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{NOTIFICATION_SERVICE_URL}/notifications/",
                    json={
                        "user_id": user.id, "email": user.email,
                        "type": "password_reset", "channel": "email",
                        "subject": "🔐 Recuperación de contraseña — EcoMod",
                        "body": f"""
                        <h2>Recuperación de contraseña</h2>
                        <p>Hola {user.nombre or user.email},</p>
                        <p>Haz clic para restablecer tu contraseña (válido 15 min):</p>
                        <p><a href="{reset_link}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
                           Restablecer contraseña</a></p>
                        <p>— Equipo EcoMod</p>
                        """,
                        "reference_id": user.id, "reference_type": "user"
                    }
                )
        except Exception:
            pass
    return {"message": "Si el email existe en el sistema, recibirás un enlace de recuperación."}


@router.post("/reset-password")
async def reset_password(body: dict = Body(...), db: Session = Depends(get_db)):
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
        "service": "Auth Service", "version": "1.1.0",
        "endpoints": [
            "/auth/register (POST)", "/auth/login (POST)", "/auth/google (POST)",
            "/auth/refresh (POST)", "/auth/profile (GET)", "/auth/profile (PUT)",
            "/auth/change-password (POST)", "/auth/forgot-password (POST)",
            "/auth/reset-password (POST)", "/auth/logout (POST)",
            "/auth/verify-token (GET)", "/auth/health (GET)"
        ]
    }


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserResponse])
def get_all_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Admin privileges required.")
    return db.query(User).order_by(User.id).all()


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Admin privileges required.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/users/{user_id}/role")
def update_user_role(user_id: int, body: dict = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    new_role = body.get("role")
    if new_role not in ["admin", "cliente"]:
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'cliente'")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and new_role != "admin":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove your own admin privileges.")
    user.role = new_role
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {"message": f"User {user.email} role updated to {new_role}", "user_id": user.id, "role": user.role}


@router.patch("/users/{user_id}/status")
def update_user_status(user_id: int, body: dict = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")
    is_active = body.get("is_active")
    if not isinstance(is_active, bool):
        raise HTTPException(status_code=400, detail="is_active must be a boolean")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and not is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    user.is_active = is_active
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {"message": f"User {user.email} {'activated' if is_active else 'deactivated'}", "user_id": user.id, "is_active": user.is_active}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    if user.role == "admin":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last admin user")
    db.delete(user)
    db.commit()
    return {"message": f"User {user.email} deleted successfully"}


@router.get("/stats/users")
def get_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")
    total = db.query(User).count()
    active = db.query(User).filter(User.is_active == True).count()
    return {
        "total": total, "active": active, "inactive": total - active,
        "admins": db.query(User).filter(User.role == "admin").count(),
        "clients": db.query(User).filter(User.role == "cliente").count(),
    }