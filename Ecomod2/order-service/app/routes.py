from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app import models, schemas
from app.saga import reserve_stock_for_order, release_order_stock
from app.notifier import notify_order_confirmed, notify_order_cancelled

router = APIRouter(prefix="/orders", tags=["Orders"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/health")
def health():
    return {"status": "healthy", "service": "order-service", "timestamp": datetime.utcnow().isoformat()}

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(body: schemas.OrderCreate, db: Session = Depends(get_db)):
    total = sum(item.unit_price * item.quantity for item in body.items)
    order = models.Order(user_id=body.user_id, cart_id=body.cart_id, status=models.OrderStatus.pending, total_amount=round(total, 2), notes=body.notes)
    db.add(order)
    db.flush()
    for item in body.items:
        db.add(models.OrderItem(order_id=order.id, product_id=item.product_id, product_name=item.product_name, unit_price=item.unit_price, quantity=item.quantity, subtotal=round(item.unit_price * item.quantity, 2)))
    db.commit()
    db.refresh(order)

    saga_result = await reserve_stock_for_order(body.items)
    email = getattr(body, "email", None) or f"usuario_{body.user_id}@ecomod.com"

    if saga_result["success"]:
        order.status = models.OrderStatus.confirmed
        db.commit()
        db.refresh(order)
        await notify_order_confirmed(order.id, body.user_id, email, order.total_amount, len(body.items))
    else:
        order.status = models.OrderStatus.cancelled
        order.notes = f"Cancelada: {saga_result['message']}"
        db.commit()
        db.refresh(order)
        await notify_order_cancelled(order.id, body.user_id, email, saga_result["message"])

    return order

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/user/{user_id}", response_model=List[schemas.OrderResponse])
def get_orders_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Order).filter(models.Order.user_id == user_id).order_by(models.Order.created_at.desc()).all()

@router.patch("/{order_id}/status", response_model=schemas.OrderResponse)
async def update_order_status(order_id: int, update: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if update.status == "cancelled" and order.status == "confirmed":
        await release_order_stock(order.items)
    order.status = update.status
    db.commit()
    db.refresh(order)
    return order

@router.get("/", response_model=List[schemas.OrderResponse])
def get_all_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()