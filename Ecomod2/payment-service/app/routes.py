from datetime import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4
import os
import stripe

from app.database import SessionLocal
from app import models, schemas
from app.processor import notify_order_payment_result
from app.notifier import notify_payment_succeeded, notify_payment_failed
from app.paypal_client import create_paypal_payment, execute_paypal_payment

# Configurar logger
logger = logging.getLogger(__name__)

# Configurar Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# ─── URLs de entorno 
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

router = APIRouter(prefix="/payments", tags=["Payments"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ========== HEALTH ==========
@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "payment-service",
        "timestamp": datetime.utcnow().isoformat()
    }


# ========== STRIPE ENDPOINTS ==========

@router.post("/stripe/create-intent")
async def create_stripe_intent(body: dict, db: Session = Depends(get_db)):
    order_id = body.get("order_id")
    user_id  = body.get("user_id")
    amount   = body.get("amount")

    if not order_id or not user_id or not amount:
        raise HTTPException(status_code=400, detail="Faltan campos requeridos: order_id, user_id, amount")

    # Limpiar pagos pendientes anteriores para esta orden
    existing = db.query(models.Payment).filter(
        models.Payment.order_id == order_id,
        models.Payment.status   == "pending"
    ).all()
    for p in existing:
        logger.info(f"🗑️ Eliminando pago pendiente previo ID: {p.id} para orden {order_id}")
        db.delete(p)
    db.commit()

    # Modo simulación (sin clave Stripe)
    if not stripe.api_key:
        fake_secret    = f"sim_secret_{uuid4().hex}"
        fake_intent_id = f"sim_pi_{uuid4().hex}"

        payment = models.Payment(
            order_id=order_id,
            user_id=user_id,
            amount=amount,
            payment_method="card_stripe",
            status="pending",
            transaction_id=fake_intent_id
        )
        db.add(payment)
        db.commit()

        return {
            "client_secret":     fake_secret,
            "payment_intent_id": fake_intent_id,
            "payment_id":        payment.id,
            "simulation":        True
        }

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount),
            currency="cop",
            metadata={"order_id": order_id, "user_id": user_id}
        )

        payment = models.Payment(
            order_id=order_id,
            user_id=user_id,
            amount=amount,
            payment_method="card_stripe",
            status="pending",
            transaction_id=intent.id
        )
        db.add(payment)
        db.commit()

        return {
            "client_secret":     intent.client_secret,
            "payment_intent_id": intent.id,
            "payment_id":        payment.id
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stripe/confirm")
async def confirm_stripe_payment(body: dict, db: Session = Depends(get_db)):
    payment_intent_id = body.get("payment_intent_id")
    order_id          = body.get("order_id")
    user_id           = body.get("user_id")
    amount            = body.get("amount")
    payment_method    = body.get("payment_method", "card_stripe")
    email             = body.get("email", f"user_{user_id}@ecomod.com")

    if not payment_intent_id:
        raise HTTPException(status_code=400, detail="payment_intent_id es requerido")

    payment = db.query(models.Payment).filter(
        models.Payment.transaction_id == payment_intent_id
    ).first()

    if not payment:
        payment = models.Payment(
            order_id=order_id,
            user_id=user_id,
            amount=amount,
            payment_method=payment_method,
            status="pending",
            transaction_id=payment_intent_id
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

    # Modo simulación
    if not stripe.api_key:
        payment.status         = "succeeded"
        payment.transaction_id = f"sim_txn_{uuid4().hex}"
        db.commit()

        await notify_order_payment_result(
            order_id, success=True,
            user_id=user_id, email=email,
            amount=amount, transaction_id=payment.transaction_id
        )
        await notify_payment_succeeded(
            payment.id, order_id, user_id, email, amount, payment.transaction_id
        )

        return {
            "id":             payment.id,
            "order_id":       payment.order_id,
            "user_id":        payment.user_id,
            "amount":         payment.amount,
            "status":         payment.status,
            "payment_method": payment.payment_method,
            "transaction_id": payment.transaction_id,
            "created_at":     payment.created_at
        }

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)

        if intent.status == "succeeded":
            payment.status         = "succeeded"
            payment.transaction_id = intent.id
            db.commit()

            await notify_order_payment_result(
                order_id, success=True,
                user_id=user_id, email=email,
                amount=amount, transaction_id=intent.id
            )
            await notify_payment_succeeded(
                payment.id, order_id, user_id, email, amount, intent.id
            )

        elif intent.status in ["requires_payment_method", "requires_confirmation", "requires_action"]:
            payment.status = "pending"
            db.commit()
            raise HTTPException(status_code=400, detail=f"Pago no completado: {intent.status}")

        else:
            payment.status         = "failed"
            payment.failure_reason = f"Stripe status: {intent.status}"
            db.commit()

            await notify_order_payment_result(
                order_id, success=False,
                user_id=user_id, email=email,
                amount=amount, transaction_id=""
            )
            await notify_payment_failed(
                payment.id, order_id, user_id, email, payment.failure_reason
            )
            raise HTTPException(status_code=400, detail=f"Pago fallido: {intent.status}")

        return {
            "id":             payment.id,
            "order_id":       payment.order_id,
            "user_id":        payment.user_id,
            "amount":         payment.amount,
            "status":         payment.status,
            "payment_method": payment.payment_method,
            "transaction_id": payment.transaction_id,
            "created_at":     payment.created_at
        }

    except stripe.error.StripeError as e:
        payment.status         = "failed"
        payment.failure_reason = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))


# ========== PAYPAL ENDPOINTS ==========

@router.post("/paypal/create")
async def create_paypal_order(body: dict, db: Session = Depends(get_db)):
    """
    Crea un pago real en PayPal y devuelve la approval_url para redirigir al usuario.
    """
    order_id = body.get("order_id")
    user_id  = body.get("user_id")
    amount   = body.get("amount")   # ya viene en USD desde el frontend

    if not order_id or not user_id or not amount:
        raise HTTPException(status_code=400, detail="Faltan campos requeridos: order_id, user_id, amount")

    # Limpiar pagos PayPal pendientes anteriores para esta orden
    existing = db.query(models.Payment).filter(
        models.Payment.order_id       == order_id,
        models.Payment.payment_method == "paypal",
        models.Payment.status         == "pending"
    ).all()
    for p in existing:
        logger.info(f"🗑️ Eliminando pago PayPal pendiente ID: {p.id} para orden {order_id}")
        db.delete(p)
    db.commit()

    # PayPal redirige al usuario a estas URLs tras aprobar/cancelar.
    return_url = f"{FRONTEND_URL}/paypal-return?order_id={order_id}"
    cancel_url = f"{FRONTEND_URL}/payments?paypal=cancelled&order_id={order_id}"

    # ─── Verificar credenciales PayPal 
    paypal_client_id = os.getenv("PAYPAL_CLIENT_ID", "")
    paypal_secret    = os.getenv("PAYPAL_SECRET_KEY", "")

    if not paypal_client_id or not paypal_secret:
        # ── Modo simulación: sin credenciales PayPal reales 
        logger.warning("⚠️ PAYPAL_CLIENT_ID / PAYPAL_SECRET_KEY no configurados — modo simulación")

        payment = models.Payment(
            order_id=order_id,
            user_id=user_id,
            amount=amount,
            payment_method="paypal",
            status="pending",
            transaction_id=f"SIM-PAYPAL-{uuid4().hex[:10].upper()}"
        )
        db.add(payment)
        db.commit()

        # En simulación redirigimos directamente al return con params falsos
        sim_url = (
            f"{FRONTEND_URL}/paypal-return"
            f"?paymentId={payment.transaction_id}"
            f"&PayerID=SIM_PAYER"
            f"&order_id={order_id}"
        )
        return {
            "success":      True,
            "approval_url": sim_url,
            "simulation":   True
        }

    # ─── Modo real: llamar a PayPal SDK ──
    result = create_paypal_payment(
        order_id=order_id,
        amount=round(float(amount), 2),
        return_url=return_url,
        cancel_url=cancel_url
    )

    if not result.get("success"):
        logger.error(f"❌ PayPal create error: {result.get('error')}")
        raise HTTPException(
            status_code=502,
            detail=f"Error al crear pago en PayPal: {result.get('error', 'Error desconocido')}"
        )

    # Guardar pago pendiente con el ID real de PayPal
    payment = models.Payment(
        order_id=order_id,
        user_id=user_id,
        amount=amount,
        payment_method="paypal",
        status="pending",
        transaction_id=result["payment_id"]   
    )
    db.add(payment)
    db.commit()

    logger.info(f"✅ PayPal order creada | orden={order_id} | paypal_id={result['payment_id']}")

    return {
        "success":      True,
        "approval_url": result["approval_url"],   
        "payment_id":   result["payment_id"],
        "simulation":   False
    }


@router.get("/paypal/execute")
async def execute_paypal_order(
    paymentId: str = None,
    PayerID:   str = None,
    order_id:  int = None,
    db: Session = Depends(get_db)
):
    """
    PayPal redirige aquí tras la aprobación del usuario.
    Ejecuta el pago y actualiza el estado en BD.
    """
    if not paymentId or not order_id:
        raise HTTPException(status_code=400, detail="Faltan parámetros: paymentId y order_id son requeridos")

    # Buscar el pago pendiente en BD
    payment = db.query(models.Payment).filter(
        models.Payment.order_id       == order_id,
        models.Payment.payment_method == "paypal"
    ).order_by(models.Payment.created_at.desc()).first()

    if not payment:
        raise HTTPException(status_code=404, detail=f"No se encontró pago PayPal para la orden #{order_id}")

    # Si ya fue procesado, responder sin duplicar
    if payment.status == "succeeded":
        logger.info(f"✅ Pago de orden #{order_id} ya fue procesado — retornando éxito")
        return {"success": True, "message": "Pago ya fue procesado exitosamente", "already_processed": True}

    # ─── Modo simulación 
    is_simulation = paymentId.startswith("SIM-PAYPAL-")
    paypal_client_id = os.getenv("PAYPAL_CLIENT_ID", "")

    if is_simulation or not paypal_client_id:
        payment.status         = "succeeded"
        payment.transaction_id = paymentId
        db.commit()

        await notify_order_payment_result(
            order_id, success=True,
            user_id=payment.user_id,
            email=f"user_{payment.user_id}@ecomod.com",
            amount=payment.amount,
            transaction_id=paymentId
        )
        await notify_payment_succeeded(
            payment.id, order_id, payment.user_id,
            f"user_{payment.user_id}@ecomod.com",
            payment.amount, paymentId
        )

        logger.info(f"✅ [SIMULACIÓN] Pago PayPal orden #{order_id} completado")
        return {"success": True, "message": "Pago PayPal completado (simulación)"}

    # ─── Modo real: ejecutar en PayPal SDK 
    result = execute_paypal_payment(
        payment_id=paymentId,
        payer_id=PayerID or "",
        order_id=order_id
    )

    if result.get("success"):
        payment.status         = "succeeded"
        payment.transaction_id = result.get("transaction_id", paymentId)
        db.commit()

        await notify_order_payment_result(
            order_id, success=True,
            user_id=payment.user_id,
            email=f"user_{payment.user_id}@ecomod.com",
            amount=payment.amount,
            transaction_id=payment.transaction_id
        )
        await notify_payment_succeeded(
            payment.id, order_id, payment.user_id,
            f"user_{payment.user_id}@ecomod.com",
            payment.amount, payment.transaction_id
        )

        logger.info(f"✅ Pago PayPal ejecutado | orden={order_id} | txn={payment.transaction_id}")
        return {
            "success":    True,
            "message":    "Pago PayPal completado exitosamente",
            "payment_id": payment.id
        }

    else:
        payment.status         = "failed"
        payment.failure_reason = result.get("error", "Error al ejecutar pago PayPal")
        db.commit()

        await notify_order_payment_result(order_id, success=False, user_id=payment.user_id, email="", amount=0, transaction_id="")
        await notify_payment_failed(
            payment.id, order_id, payment.user_id, "", payment.failure_reason
        )

        logger.error(f"❌ PayPal execute fallido | orden={order_id} | error={result.get('error')}")
        raise HTTPException(status_code=400, detail=result.get("error", "Error al procesar pago PayPal"))


# ========== CRUD ENDPOINTS ==========

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
    return db.query(models.Payment).filter(models.Payment.order_id == order_id).all()


@router.get("/{payment_id}", response_model=schemas.PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/{payment_id}/refund", response_model=schemas.PaymentResponse)
async def refund_payment(
    payment_id: int,
    request: schemas.PaymentRefundRequest,
    db: Session = Depends(get_db)
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status != "succeeded":
        raise HTTPException(
            status_code=400,
            detail=f"Solo se pueden reembolsar pagos exitosos. Estado actual: {payment.status}"
        )
    payment.status         = "refunded"
    payment.failure_reason = request.reason
    db.commit()
    db.refresh(payment)

    await notify_order_payment_result(
        payment.order_id, success=False,
        user_id=payment.user_id, email="", amount=0, transaction_id=""
    )
    return payment


@router.get("/", response_model=List[schemas.PaymentResponse])
def get_all_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.Payment)
        .order_by(models.Payment.created_at.desc())
        .offset(skip).limit(limit)
        .all()
    )