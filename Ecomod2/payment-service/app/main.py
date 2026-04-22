import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine, SessionLocal
from app.models import Base, Payment
from app.event_bus import subscribe_events, publish_event
from app.notifier import notify_payment_succeeded, notify_payment_failed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Payment Service",
    description="Microservicio de pagos — Stripe & PayPal — Saga coreografiada con RabbitMQ",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


async def handle_event(event_type: str, data: dict):
    """
    Maneja eventos del bus de mensajes (RabbitMQ).

    inventory.reserved → Payment Service inicia el cobro.
    Este handler solo se activa en flujo automático (Saga sin intervención
    del usuario). En el flujo normal el frontend llama directamente a
    /payments/stripe/create-intent o /payments/paypal/create.
    """
    db = SessionLocal()
    try:
        if event_type == "inventory.reserved":
            order_id = data.get("order_id")
            user_id  = data.get("user_id")
            amount   = data.get("amount", 0)
            email    = data.get("email") or f"usuario_{user_id}@ecomod.com"
            payment_method = data.get("payment_method", "card_stripe")

            # Solo procesar métodos conocidos
            if payment_method not in ("card_stripe", "paypal"):
                logger.warning(
                    f"Método de pago desconocido '{payment_method}' para orden #{order_id}. "
                    "Se usará card_stripe por defecto."
                )
                payment_method = "card_stripe"

            # Evitar doble pago
            existing = db.query(Payment).filter(
                Payment.order_id == order_id,
                Payment.status   == "succeeded",
            ).first()
            if existing:
                logger.info(f"Orden #{order_id} ya tiene pago exitoso — ignorando evento")
                return

            # Crear registro pendiente
            payment = Payment(
                order_id=       order_id,
                user_id=        user_id,
                amount=         amount,
                payment_method= payment_method,
                status=         "pending",
            )
            db.add(payment)
            db.commit()
            db.refresh(payment)

            # ── Nota: en el flujo real con Stripe / PayPal el usuario debe
            # ── interactuar en el frontend para confirmar el pago.
            # ── Este handler publica payment.pending para que el frontend
            # ── sepa que debe iniciar el checkout.

            await publish_event("payment.pending", {
                "order_id":       order_id,
                "payment_id":     payment.id,
                "user_id":        user_id,
                "email":          email,
                "amount":         amount,
                "payment_method": payment_method,
            })

            logger.info(
                f"Pago pendiente creado para orden #{order_id} "
                f"(método: {payment_method}, monto: {amount})"
            )

    except Exception as e:
        logger.error(f"Error en handle_event({event_type}): {e}")
    finally:
        db.close()


@app.on_event("startup")
async def startup():
    asyncio.create_task(
        subscribe_events(
            routing_keys=["inventory.reserved"],
            callback=handle_event,
            queue_name="payment-service-queue",
        )
    )
    logger.info("Payment Service escuchando eventos RabbitMQ → inventory.reserved")


@app.get("/")
def root():
    return {
        "service":          "payment-service",
        "version":          "2.1.0",
        "payment_methods":  ["card_stripe", "paypal"],
        "events_published": ["payment.pending", "payment.succeeded", "payment.failed"],
        "events_consumed":  ["inventory.reserved"],
        "endpoints": {
            "stripe":  ["/payments/stripe/create-intent", "/payments/stripe/confirm"],
            "paypal":  ["/payments/paypal/create", "/payments/paypal/execute"],
            "queries": ["/payments/", "/payments/{id}", "/payments/order/{order_id}", "/payments/user/{user_id}"],
        },
    }