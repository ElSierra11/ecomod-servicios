from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app import models, schemas
from app.processor import process_payment as run_payment, notify_order_payment_result
from app.notifier import notify_payment_succeeded, notify_payment_failed

router = APIRouter(prefix="/payments", tags=["Payments"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/health")
def health():
    return {"status": "healthy", "service": "payment-service", "timestamp": datetime.utcnow().isoformat()}

@router.post("/", response_model=schemas.PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(body: schemas.PaymentCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Payment).filter(
        models.Payment.order_id == body.order_id,
        models.Payment.status == "succeeded"
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"La orden {body.order_id} ya tiene un pago exitoso registrado")

    payment = models.Payment(order_id=body.order_id, user_id=body.user_id, amount=body.amount, payment_method=body.payment_method, status="pending")
    db.add(payment)
    db.commit()
    db.refresh(payment)

    result = await run_payment(body.amount, body.payment_method)
    email = getattr(body, "email", None) or f"usuario_{body.user_id}@ecomod.com"

    if result["success"]:
        payment.status = "succeeded"
        payment.transaction_id = result["transaction_id"]
        db.commit()
        db.refresh(payment)
        await notify_order_payment_result(body.order_id, success=True)
        await notify_payment_succeeded(payment.id, body.order_id, body.user_id, email, body.amount, payment.transaction_id)
    else:
        payment.status = "failed"
        payment.failure_reason = result["reason"]
        db.commit()
        db.refresh(payment)
        await notify_order_payment_result(body.order_id, success=False)
        await notify_payment_failed(payment.id, body.order_id, body.user_id, email, payment.failure_reason)

    return payment

@router.get("/user/{user_id}", response_model=List[schemas.PaymentResponse])
def get_payments_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Payment).filter(models.Payment.user_id == user_id).order_by(models.Payment.created_at.desc()).all()

@router.get("/order/{order_id}", response_model=List[schemas.PaymentResponse])
def get_payments_by_order(order_id: int, db: Session = Depends(get_db)):
    return db.query(models.Payment).filter(models.Payment.order_id == order_id).all()

@router.get("/{payment_id}", response_model=schemas.PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.post("/{payment_id}/refund", response_model=schemas.PaymentResponse)
async def refund_payment(payment_id: int, request: schemas.PaymentRefundRequest, db: Session = Depends(get_db)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status != "succeeded":
        raise HTTPException(status_code=400, detail=f"Solo se pueden reembolsar pagos exitosos. Estado actual: {payment.status}")
    payment.status = "refunded"
    payment.failure_reason = request.reason
    db.commit()
    db.refresh(payment)
    await notify_order_payment_result(payment.order_id, success=False)
    return payment

@router.get("/", response_model=List[schemas.PaymentResponse])
def get_all_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Payment).order_by(models.Payment.created_at.desc()).offset(skip).limit(limit).all()