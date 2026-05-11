import httpx
import os
import logging
import stripe
from app.event_bus import publish_event

logger = logging.getLogger(__name__)

ORDER_SERVICE_URL     = os.getenv("ORDER_SERVICE_URL",     "http://order-service:8004")
INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8002")
SHIPPING_SERVICE_URL  = os.getenv("SHIPPING_SERVICE_URL",  "http://shipping-service:8006")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

COP_TO_USD_RATE = 4200  


def cop_to_usd_cents(amount_cop: float) -> int:
    usd   = amount_cop / COP_TO_USD_RATE
    cents = int(round(usd * 100))
    return max(cents, 50)


# ─── Stripe: Paso 1 — Crear PaymentIntent 

def create_payment_intent(amount_cop: float, order_id: int, user_id: int) -> dict:
    if not stripe.api_key:
        return {"success": False, "reason": "STRIPE_SECRET_KEY no configurada en .env"}
    try:
        amount_cents = cop_to_usd_cents(amount_cop)
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            metadata={
                "order_id":   str(order_id),
                "user_id":    str(user_id),
                "amount_cop": str(int(amount_cop)),
            },
            description=f"EcoMod — Orden #{order_id}",
        )
        return {
            "success":          True,
            "client_secret":    intent.client_secret,
            "intent_id":        intent.id,
            "amount_usd_cents": amount_cents,
        }
    except stripe.error.AuthenticationError:
        return {"success": False, "reason": "Error de autenticación con Stripe — verifica STRIPE_SECRET_KEY"}
    except stripe.error.StripeError as e:
        return {"success": False, "reason": f"Error de Stripe: {str(e)}"}


# ─── Stripe: Paso 2 — Confirmar PaymentIntent 

def confirm_payment_intent(payment_intent_id: str) -> dict:
    if not stripe.api_key:
        return {"success": False, "reason": "STRIPE_SECRET_KEY no configurada en .env"}
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status == "succeeded":
            return {"success": True, "transaction_id": intent.id, "message": "Pago confirmado exitosamente"}
        elif intent.status in ("requires_payment_method", "canceled"):
            return {"success": False, "reason": f"Pago no completado — estado Stripe: {intent.status}"}
        else:
            return {"success": False, "reason": f"Estado inesperado de Stripe: {intent.status}"}
    except stripe.error.InvalidRequestError as e:
        return {"success": False, "reason": f"PaymentIntent inválido: {str(e)}"}
    except stripe.error.StripeError as e:
        return {"success": False, "reason": f"Error de Stripe al confirmar: {str(e)}"}


# Helpers de Saga

NOTIFICATION_SERVICE_URL = os.getenv(
    "NOTIFICATION_SERVICE_URL",
    "http://notification-service:8007"
)

async def notify_order_payment_result(order_id: int, success: bool, user_id: int = 0, email: str = "", amount: float = 0, transaction_id: str = ""):

    if success:
        # Intentar publicar via RabbitMQ (para shipping-service, etc.)
        try:
            await publish_event("payment.succeeded", {
                "order_id":       order_id,
                "user_id":        user_id,
                "email":          email,
                "amount":         amount,
                "transaction_id": transaction_id,
            })
        except Exception as e:
            logger.warning(f"RabbitMQ no disponible, continuando con HTTP: {e}")

        # Llamar directamente al notification-service por HTTP (siempre)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{NOTIFICATION_SERVICE_URL}/notifications/events/payment-succeeded",
                    json={
                        "payment_id": 0,
                        "order_id":   order_id,
                        "user_id":    user_id,
                        "email":      email,
                        "amount":     amount,
                        "transaction_id": transaction_id,
                    }
                )
                logger.info(f"✅ Notificación de pago exitoso enviada para orden #{order_id}")
        except Exception as e:
            logger.error(f"❌ Error enviando notificación HTTP: {e}")

        # Actualizar estado de la orden
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.patch(
                    f"{ORDER_SERVICE_URL}/orders/{order_id}/status",
                    json={"status": "paid"}
                )
                logger.info(f"✅ Orden #{order_id} marcada como pagada")
        except Exception as e:
            logger.warning(f"⚠️ No se pudo actualizar estado de orden: {e}")

    else:
        try:
            await publish_event("payment.failed", {
                "order_id": order_id,
                "message":  "Pago fallido o rechazado",
            })
        except Exception as e:
            logger.warning(f"RabbitMQ no disponible: {e}")

        # Notificar fallo por HTTP
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{NOTIFICATION_SERVICE_URL}/notifications/events/payment-failed",
                    json={
                        "payment_id": 0,
                        "order_id":   order_id,
                        "user_id":    user_id,
                        "email":      email,
                        "reason":     "Pago fallido o rechazado",
                    }
                )
        except Exception as e:
            logger.error(f"❌ Error enviando notificación de fallo: {e}")



async def release_inventory_on_failure(order_items: list):
    """Compensación Saga: libera stock reservado si el pago falla."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for item in order_items:
                await client.post(
                    f"{INVENTORY_SERVICE_URL}/inventory/release",
                    json={
                        "product_id": item["product_id"],
                        "quantity":   item["quantity"],
                    },
                )
    except Exception:
        pass