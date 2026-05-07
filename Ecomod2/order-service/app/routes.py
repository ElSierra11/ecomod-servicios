from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app import models, schemas
from app.event_bus import publish_event
from app.notifier import notify_order_cancelled

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
    """
    Saga Coreografiada paso 1:
    1. Crea la orden en estado 'pending'
    2. Publica evento 'order.created' en RabbitMQ
    3. Inventory Service escucha y reserva stock
    4. Payment Service escucha y procesa pago
    5. Shipping Service escucha y crea envío
    6. Order Service escucha 'shipping.confirmed' y confirma la orden
    """
    total = sum(item.unit_price * item.quantity for item in body.items)

    order = models.Order(
        user_id=body.user_id, cart_id=body.cart_id,
        status=models.OrderStatus.pending,
        total_amount=round(total, 2), notes=body.notes,
    )
    db.add(order)
    db.flush()

    for item in body.items:
        db.add(models.OrderItem(
            order_id=order.id, product_id=item.product_id,
            product_name=item.product_name, unit_price=item.unit_price,
            quantity=item.quantity, subtotal=round(item.unit_price * item.quantity, 2)
        ))

    # Historial inicial
    db.add(models.OrderStatusHistory(
        order_id=order.id,
        status=models.OrderStatus.pending,
        comment="Orden creada — Esperando validación de inventario"
    ))

    db.commit()
    db.refresh(order)

    # Publicar evento order.created — Saga arranca
    email = getattr(body, "email", None) or f"usuario_{body.user_id}@ecomod.com"
    await publish_event("order.created", {
        "order_id": order.id,
        "user_id": body.user_id,
        "email": email,
        "total_amount": order.total_amount,
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price
            } for item in body.items
        ]
    })

    return order

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/user/{user_id}", response_model=List[schemas.OrderResponse])
def get_orders_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Order).filter(
        models.Order.user_id == user_id
    ).order_by(models.Order.created_at.desc()).all()

@router.patch("/{order_id}/status", response_model=schemas.OrderResponse)
async def update_order_status(order_id: int, update: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    old_status = order.status
    order.status = update.status
    
    # Historial de cambio
    db.add(models.OrderStatusHistory(
        order_id=order.id,
        status=update.status,
        comment=f"Estado actualizado de {old_status} a {update.status}"
    ))

    db.commit()
    db.refresh(order)
    
    if update.status == "cancelled" and old_status != "cancelled":
        # Publicar evento para liberar inventario y notificar a otros servicios
        await publish_event("order.cancelled", {
            "order_id": order.id,
            "user_id": order.user_id,
            "items": [{"product_id": item.product_id, "quantity": item.quantity} for item in order.items]
        })
        
    return order

@router.get("/", response_model=List[schemas.OrderResponse])
def get_all_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(
        models.Order.created_at.desc()
    ).offset(skip).limit(limit).all()