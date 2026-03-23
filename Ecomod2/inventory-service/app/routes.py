from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app import models, schemas
from app.auth import require_admin

router = APIRouter(prefix="/inventory", tags=["Inventory"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/health")
def health():
    return {"status": "healthy", "service": "inventory-service", "timestamp": datetime.utcnow().isoformat()}

@router.get("/", response_model=List[schemas.InventoryResponse])
def get_all_inventory(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000), db: Session = Depends(get_db)):
    return db.query(models.Inventory).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_inventory(inventory: schemas.InventoryCreate, db: Session = Depends(get_db), token: dict = Depends(require_admin)):
    existing = db.query(models.Inventory).filter(models.Inventory.product_id == inventory.product_id).first()
    if existing:
        existing.quantity = inventory.quantity
        db.commit()
        return {"message": "Inventory updated successfully", "product_id": inventory.product_id}
    else:
        db_item = models.Inventory(product_id=inventory.product_id, quantity=inventory.quantity, reserved=0)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return {"message": "Inventory created successfully", "product_id": inventory.product_id}

@router.post("/reserve", response_model=schemas.ReserveResponse)
def reserve_stock(request: schemas.ReserveRequest, db: Session = Depends(get_db)):
    item = db.query(models.Inventory).filter(models.Inventory.product_id == request.product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inventory for product {request.product_id} not found")
    available = item.quantity - item.reserved
    if request.quantity > available:
        return schemas.ReserveResponse(success=False, product_id=request.product_id, reserved=0, remaining=available, message=f"Insufficient stock. Available: {available}")
    item.reserved += request.quantity
    db.commit()
    remaining = item.quantity - item.reserved
    return schemas.ReserveResponse(success=True, product_id=request.product_id, reserved=request.quantity, remaining=remaining, message=f"Stock reserved successfully. Remaining available: {remaining}")

@router.post("/release", response_model=schemas.ReserveResponse)
def release_stock(request: schemas.ReserveRequest, db: Session = Depends(get_db)):
    item = db.query(models.Inventory).filter(models.Inventory.product_id == request.product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inventory for product {request.product_id} not found")
    if request.quantity > item.reserved:
        return schemas.ReserveResponse(success=False, product_id=request.product_id, reserved=0, remaining=item.quantity - item.reserved, message=f"Cannot release more than reserved. Reserved: {item.reserved}")
    item.reserved -= request.quantity
    db.commit()
    remaining = item.quantity - item.reserved
    return schemas.ReserveResponse(success=True, product_id=request.product_id, reserved=request.quantity, remaining=remaining, message=f"Stock released successfully. Available: {remaining}")

@router.get("/{product_id}", response_model=schemas.InventoryResponse)
def get_inventory(product_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inventory for product {product_id} not found")
    return item

@router.put("/{product_id}", response_model=schemas.MessageResponse)
def update_inventory(product_id: int, update_data: schemas.InventoryUpdate, db: Session = Depends(get_db), token: dict = Depends(require_admin)):
    item = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inventory for product {product_id} not found")
    if update_data.quantity is not None:
        item.quantity = update_data.quantity
    db.commit()
    return {"message": "Inventory updated successfully", "product_id": product_id}

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(product_id: int, db: Session = Depends(get_db), token: dict = Depends(require_admin)):
    item = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inventory for product {product_id} not found")
    db.delete(item)
    db.commit()
    return None