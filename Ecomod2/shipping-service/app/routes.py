from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import httpx
import os

from app.database import SessionLocal
from app import models, schemas
from app.logistics import calculate_shipping_cost, generate_tracking_number, SHIPPING_RATES, CARRIERS
from app.notifier import notify_shipment_created, notify_shipment_delivered

router = APIRouter(prefix="/shipping", tags=["Shipping"])

ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8004")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def update_order_status(order_id: int, new_status: str):

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.patch(
                f"{ORDER_SERVICE_URL}/orders/{order_id}/status",
                json={"status": new_status}
            )
    except Exception:
        pass


@router.get("/health")
def health():
    return {"status": "healthy", "service": "shipping-service", "timestamp": datetime.utcnow().isoformat()}


@router.get("/calculate", response_model=schemas.ShippingCostResponse)
def calculate_cost(department: str, carrier: str = "Servientrega"):
    result = calculate_shipping_cost(department, carrier)
    return {
        "city": department, "department": department,
        "carrier": carrier, "cost": result["cost"],
        "estimated_days": result["estimated_days"]
    }


@router.get("/rates")
def get_rates():
    return {
        "rates": [{"department": d, "cost": v["cost"], "days": v["days"]} for d, v in SHIPPING_RATES.items()],
        "carriers": CARRIERS
    }


@router.post("/", response_model=schemas.ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_shipment(body: schemas.ShipmentCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Shipment).filter(models.Shipment.order_id == body.order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Ya existe un envío para la orden {body.order_id}")

    logistics = calculate_shipping_cost(body.department, body.carrier)
    tracking  = generate_tracking_number(body.carrier)

    shipment = models.Shipment(
        order_id=body.order_id,
        user_id=body.user_id,
        recipient_name=body.recipient_name,
        address=body.address,
        city=body.city,
        department=body.department,
        postal_code=body.postal_code,
        country=body.country,
        carrier=body.carrier,
        tracking_number=tracking,
        shipping_cost=logistics["cost"],
        estimated_delivery=logistics["estimated_delivery"],
        status="processing"
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    #  actualizar orden a 'shipped' ahora que el envío existe
    await update_order_status(body.order_id, "shipped")

    # Notificar al usuario
    email = getattr(body, "email", None) or f"usuario_{body.user_id}@ecomod.com"
    estimated_str = (
        logistics["estimated_delivery"].strftime("%d/%m/%Y")
        if logistics.get("estimated_delivery") else "Próximamente"
    )
    await notify_shipment_created(
        shipment.id, body.order_id, body.user_id,
        email, tracking, body.carrier, estimated_str
    )

    return shipment


@router.get("/user/{user_id}", response_model=List[schemas.ShipmentResponse])
def get_shipments_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Shipment).filter(
        models.Shipment.user_id == user_id
    ).order_by(models.Shipment.created_at.desc()).all()


@router.get("/order/{order_id}", response_model=schemas.ShipmentResponse)
def get_shipment_by_order(order_id: int, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.order_id == order_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="No shipment found for this order")
    return shipment


@router.get("/tracking/{tracking_number}", response_model=schemas.ShipmentResponse)
def get_by_tracking(tracking_number: str, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(
        models.Shipment.tracking_number == tracking_number
    ).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    return shipment


@router.get("/{shipment_id}", response_model=schemas.ShipmentResponse)
def get_shipment(shipment_id: int, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.patch("/{shipment_id}/status", response_model=schemas.ShipmentResponse)
async def update_status(shipment_id: int, update: schemas.ShipmentStatusUpdate, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    shipment.status = update.status
    db.commit()
    db.refresh(shipment)

    # Si se marca como entregado, actualizar orden a 'delivered' y notificar
    if update.status == "delivered":
        await update_order_status(shipment.order_id, "delivered")
        email = f"usuario_{shipment.user_id}@ecomod.com"
        await notify_shipment_delivered(
            shipment.id, shipment.order_id,
            shipment.user_id, email, shipment.tracking_number
        )

    return shipment


@router.get("/", response_model=List[schemas.ShipmentResponse])
def get_all_shipments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Shipment).order_by(
        models.Shipment.created_at.desc()
    ).offset(skip).limit(limit).all()