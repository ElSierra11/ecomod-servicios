import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app import models, schemas

router = APIRouter(prefix="/cart", tags=["Cart"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# HEALTH
@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "cart-service",
        "timestamp": datetime.utcnow().isoformat()
    }


# CREAR CARRITO

@router.post("/", response_model=schemas.CartResponse, status_code=status.HTTP_201_CREATED)
def create_cart(body: schemas.CartCreate, db: Session = Depends(get_db)):
    """
    Crea un carrito nuevo.
    - Si viene user_id → carrito autenticado
    - Si no viene nada → genera un token anónimo automáticamente
    """
    # Verificar si ya existe un carrito para ese usuario
    if body.user_id:
        existing = db.query(models.Cart).filter(
            models.Cart.user_id == body.user_id
        ).first()
        if existing:
            return schemas.CartResponse.model_validate(existing)

    cart = models.Cart(
        user_id=body.user_id,
        anonymous_token=body.anonymous_token or str(uuid.uuid4())
    )
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return schemas.CartResponse.model_validate(cart)


# OBTENER CARRITO

@router.get("/user/{user_id}", response_model=schemas.CartResponse)
def get_cart_by_user(user_id: int, db: Session = Depends(get_db)):
    """Obtener el carrito de un usuario autenticado."""
    cart = db.query(models.Cart).filter(
        models.Cart.user_id == user_id
    ).first()
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No cart found for user {user_id}"
        )
    return schemas.CartResponse.model_validate(cart)


@router.get("/anonymous/{token}", response_model=schemas.CartResponse)
def get_cart_by_token(token: str, db: Session = Depends(get_db)):
    """Obtener el carrito anónimo por token."""
    cart = db.query(models.Cart).filter(
        models.Cart.anonymous_token == token
    ).first()
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    return schemas.CartResponse.model_validate(cart)


@router.get("/{cart_id}", response_model=schemas.CartResponse)
def get_cart(cart_id: int, db: Session = Depends(get_db)):
    """Obtener carrito por ID."""
    cart = db.query(models.Cart).filter(models.Cart.id == cart_id).first()
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    return schemas.CartResponse.model_validate(cart)

# AGREGAR ITEM AL CARRITO

@router.post("/{cart_id}/items", response_model=schemas.CartItemResponse, status_code=status.HTTP_201_CREATED)
def add_item(cart_id: int, item: schemas.CartItemCreate, db: Session = Depends(get_db)):
    """
    Agrega un producto al carrito.
    Si el producto ya existe, suma la cantidad.
    """
    cart = db.query(models.Cart).filter(models.Cart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # Si ya existe ese producto en el carrito, solo suma cantidad
    existing_item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart_id,
        models.CartItem.product_id == item.product_id
    ).first()

    if existing_item:
        existing_item.quantity += item.quantity
        db.commit()
        db.refresh(existing_item)
        return schemas.CartItemResponse.model_validate(existing_item)

    new_item = models.CartItem(
        cart_id=cart_id,
        product_id=item.product_id,
        unit_price=item.unit_price,
        product_name=item.product_name,
        quantity=item.quantity,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return schemas.CartItemResponse.model_validate(new_item)


# ACTUALIZAR CANTIDAD DE UN ITEM

@router.put("/{cart_id}/items/{item_id}", response_model=schemas.CartItemResponse)
def update_item(cart_id: int, item_id: int, update: schemas.CartItemUpdate, db: Session = Depends(get_db)):
    """Actualizar la cantidad de un item en el carrito."""
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.cart_id == cart_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.quantity = update.quantity
    db.commit()
    db.refresh(item)
    return schemas.CartItemResponse.model_validate(item)

# ELIMINAR ITEM DEL CARRITO

@router.delete("/{cart_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(cart_id: int, item_id: int, db: Session = Depends(get_db)):
    """Eliminar un producto del carrito."""
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.cart_id == cart_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return None


# VACIAR CARRITO

@router.delete("/{cart_id}/items", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(cart_id: int, db: Session = Depends(get_db)):
    """Eliminar todos los items del carrito."""
    cart = db.query(models.Cart).filter(models.Cart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart_id
    ).delete()
    db.commit()
    return None


# MERGE: carrito anónimo autenticado

@router.post("/merge", response_model=schemas.CartResponse)
def merge_carts(request: schemas.CartMergeRequest, db: Session = Depends(get_db)):
    """
    Fusiona un carrito anónimo con el carrito del usuario al hacer login.
    Los items del carrito anónimo se mueven al carrito del usuario.
    Si el usuario no tiene carrito, el anónimo se convierte en el suyo.
    """
    anon_cart = db.query(models.Cart).filter(
        models.Cart.anonymous_token == request.anonymous_token
    ).first()

    if not anon_cart:
        raise HTTPException(status_code=404, detail="Anonymous cart not found")

    user_cart = db.query(models.Cart).filter(
        models.Cart.user_id == request.user_id
    ).first()

    if not user_cart:
        # El carrito anónimo se convierte en el carrito del usuario
        anon_cart.user_id = request.user_id
        anon_cart.anonymous_token = None
        db.commit()
        db.refresh(anon_cart)
        return schemas.CartResponse.model_validate(anon_cart)

    # Fusionar items del carrito anónimo al del usuario
    for anon_item in anon_cart.items:
        existing = db.query(models.CartItem).filter(
            models.CartItem.cart_id == user_cart.id,
            models.CartItem.product_id == anon_item.product_id
        ).first()

        if existing:
            existing.quantity += anon_item.quantity
        else:
            new_item = models.CartItem(
                cart_id=user_cart.id,
                product_id=anon_item.product_id,
                unit_price=anon_item.unit_price,
                product_name=anon_item.product_name,
                quantity=anon_item.quantity,
            )
            db.add(new_item)

    # Eliminar el carrito anónimo
    db.delete(anon_cart)
    db.commit()
    db.refresh(user_cart)
    return schemas.CartResponse.model_validate(user_cart)