import os
from fastapi import Header, HTTPException, status
from jose import JWTError, jwt

SECRET_KEY = os.getenv("SECRET_KEY", "ecomod_secret_dev")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def verify_token(authorization: str = Header(None)) -> dict:
    """
    Dependencia de FastAPI que valida el JWT del header Authorization.
    Uso: agregar como dependencia en cualquier endpoint.

    Ejemplo:
        @router.post("/products")
        def create_product(body: schemas.ProductCreate, token: dict = Depends(verify_token)):
            ...

    Ejemplo solo admin:
        @router.delete("/products/{id}")
        def delete_product(id: int, token: dict = Depends(require_admin)):
            ...
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_admin(authorization: str = Header(None)) -> dict:
    """
    Igual que verify_token pero además verifica que el rol sea 'admin'.
    """
    payload = verify_token(authorization)

    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador",
        )

    return payload