from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import SessionLocal
from app import models, schemas
from app.processor import (
    create_payment_intent,
    confirm_payment_intent,
    notify_order_payment_result,
    trigger_shipping_after_payment,
    release_inventory_on_failure,
)
from app.notifier import notify_payment_succeeded, notify_payment_failed
from app.paypal_client import create_paypal_payment, execute_paypal_payment
from app.event_bus import publish_event

router = APIRouter(prefix="/payments", tags=["Payments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Schemas internos ─────────────────────────────────────────────────────────

class CreateIntentRequest(BaseModel):
    order_id: int
    user_id:  int
    amount:   float  # en COP


class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str   # pi_xxx devuelto por Stripe tras confirmCardPayment
    order_id:          int
    user_id:           int
    amount:            float  # en COP (para guardar en BD)
    payment_method:    str = "card_stripe"
    email:             str | None = None


# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health")
def health():
    return {
        "status":    "healthy",
        "service":   "payment-service",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ══════════════════════════════════════════════════════════════════════════════
# STRIPE
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/stripe/create-intent")
async def create_intent(body: CreateIntentRequest):
    """
    Paso 1 — Stripe: Crea un PaymentIntent y devuelve el client_secret.
    El frontend usa stripe.confirmCardPayment(client_secret) directamente.
    No guarda nada en BD todavía.
    """
    result = create_payment_intent(body.amount, body.order_id, body.user_id)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["reason"],
        )

    return {
        "client_secret":    result["client_secret"],
        "intent_id":        result["intent_id"],
        "amount_usd_cents": result["amount_usd_cents"],
    }


@router.post(
    "/stripe/confirm",
    response_model=schemas.PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def confirm_stripe_payment(body: ConfirmPaymentRequest, db: Session = Depends(get_db)):
    """
    Paso 2 — Stripe: Verifica con Stripe que el PaymentIntent fue exitoso,
    guarda el pago en BD y dispara la Saga (orden → confirmed / cancelled).
    """
    # Evitar doble pago para la misma orden
    existing = db.query(models.Payment).filter(
        models.Payment.order_id == body.order_id,
        models.Payment.status   == "succeeded",
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La orden {body.order_id} ya tiene un pago exitoso registrado",
        )

    # Verificar con Stripe que el intent fue confirmado
    result = confirm_payment_intent(body.payment_intent_id)

    # Crear registro en BD (siempre, para trazabilidad)
    payment = models.Payment(
        order_id=       body.order_id,
        user_id=        body.user_id,
        amount=         body.amount,
        payment_method= "card_stripe",
        status=         "pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    email = body.email or f"usuario_{body.user_id}@ecomod.com"

    if result["success"]:
        payment.status         = "succeeded"
        payment.transaction_id = result["transaction_id"]
        db.commit()
        db.refresh(payment)

        # Saga: orden → confirmed
        await notify_order_payment_result(body.order_id, success=True)

        # Notificación al usuario
        await notify_payment_succeeded(
            payment.id, body.order_id, body.user_id,
            email, body.amount, payment.transaction_id,
        )
    else:
        payment.status         = "failed"
        payment.failure_reason = result["reason"]
        db.commit()
        db.refresh(payment)

        # Saga compensación: orden → cancelled
        await notify_order_payment_result(body.order_id, success=False)

        await notify_payment_failed(
            payment.id, body.order_id, body.user_id,
            email, payment.failure_reason,
        )

    return payment


# ══════════════════════════════════════════════════════════════════════════════
# PAYPAL
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/paypal/create")
async def create_paypal_order(
    body: dict = Body(...),
    db: Session = Depends(get_db),
):
    """
    Paso 1 — PayPal: Crea el pago y devuelve la approval_url.
    El frontend redirige al usuario a esa URL para que apruebe.
    """
    order_id = body.get("order_id")
    user_id  = body.get("user_id")
    amount   = body.get("amount")   # en USD

    if not all([order_id, user_id, amount]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faltan campos: order_id, user_id, amount",
        )

    # Evitar doble pago
    existing = db.query(models.Payment).filter(
        models.Payment.order_id == order_id,
        models.Payment.status   == "succeeded",
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La orden {order_id} ya tiene un pago exitoso registrado",
        )

    import os
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return_url   = f"{frontend_url}/paypal-return?order_id={order_id}"
    cancel_url   = f"{frontend_url}/payments"

    result = create_paypal_payment(order_id, amount, return_url, cancel_url)

    if result["success"]:
        # Guardar pago pendiente en BD (amount en COP)
        payment = models.Payment(
            order_id=       order_id,
            user_id=        user_id,
            amount=         float(amount) * 4200,  # USD → COP para BD
            payment_method= "paypal",
            status=         "pending",
            transaction_id= result["payment_id"],
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return {
            "success":      True,
            "payment_id":   result["payment_id"],
            "approval_url": result["approval_url"],
        }

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Error de PayPal: {result.get('error', 'Error desconocido')}",
    )


@router.get("/paypal/execute")
async def execute_paypal_order(
    paymentId: str,
    PayerID:   str,
    order_id:  int,
    db: Session = Depends(get_db),
):
    """
    Paso 2 — PayPal: Ejecuta el pago tras la aprobación del usuario.
    PayPal redirige a esta URL con paymentId y PayerID como query params.
    """
    result = execute_paypal_payment(paymentId, PayerID)

    if result["success"]:
        payment = db.query(models.Payment).filter(
            models.Payment.transaction_id == paymentId,
        ).first()

        if payment:
            payment.status         = "succeeded"
            payment.failure_reason = None
            db.commit()
            db.refresh(payment)

            email = f"usuario_{payment.user_id}@ecomod.com"

            # Saga: orden → confirmed
            await notify_order_payment_result(order_id, success=True)

            # Publicar evento para el bus
            await publish_event("payment.succeeded", {
                "order_id":       order_id,
                "payment_id":     payment.id,
                "transaction_id": paymentId,
            })

            # Notificación al usuario
            await notify_payment_succeeded(
                payment.id, order_id, payment.user_id,
                email, payment.amount, paymentId,
            )

        return {"success": True, "message": "Pago de PayPal completado exitosamente"}

    # Si falló el execute
    payment = db.query(models.Payment).filter(
        models.Payment.transaction_id == paymentId,
    ).first()
    if payment:
        payment.status         = "failed"
        payment.failure_reason = result.get("error", "Error al ejecutar pago PayPal")
        db.commit()

        await notify_order_payment_result(order_id, success=False)

        await publish_event("payment.failed", {
            "order_id": order_id,
            "reason":   payment.failure_reason,
        })

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Error ejecutando pago PayPal: {result.get('error')}",
    )


# ══════════════════════════════════════════════════════════════════════════════
# CONSULTAS Y ADMIN
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/", response_model=List[schemas.PaymentResponse])
def get_all_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.Payment)
        .order_by(models.Payment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/user/{user_id}", response_model=List[schemas.PaymentResponse])
def get_payments_by_user(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Payment)
        .filter(models.Payment.user_id == user_id)
        .order_by(models.Payment.created_at.desc())
        .all()
    )


@router.get("/order/{order_id}", response_model=List[schemas.PaymentResponse])
def get_payments_by_order(order_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Payment)
        .filter(models.Payment.order_id == order_id)
        .all()
    )


@router.get("/{payment_id}", response_model=schemas.PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/{payment_id}/refund", response_model=schemas.PaymentResponse)
async def refund_payment(
    payment_id: int,
    request:    schemas.PaymentRefundRequest,
    db:         Session = Depends(get_db),
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status != "succeeded":
        raise HTTPException(
            status_code=400,
            detail=f"Solo se pueden reembolsar pagos exitosos. Estado actual: {payment.status}",
        )
    payment.status         = "refunded"
    payment.failure_reason = request.reason
    db.commit()
    db.refresh(payment)
    await notify_order_payment_result(payment.order_id, success=False)
    return payment