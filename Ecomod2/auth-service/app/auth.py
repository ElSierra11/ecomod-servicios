from datetime import datetime, timedelta
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv("SECRET_KEY", "ecomod_secret")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "ecomod_refresh_secret")
ALGORITHM = "HS256"

def create_access_token(data: dict):
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    payload.update({"exp": expire, "type": "refresh"})
    return jwt.encode(payload, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str, token_type: str = "access"):
    try:
        key = SECRET_KEY if token_type == "access" else REFRESH_SECRET_KEY
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
        
        # Verificar expiración
        if datetime.fromtimestamp(payload["exp"]) < datetime.utcnow():
            return None
            
        # Verificar tipo de token
        if payload.get("type") != token_type:
            return None
            
        return payload
    except JWTError:
        return None