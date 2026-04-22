import httpx
import os
import stripe

ORDER_SERVICE_URL     = os.getenv("ORDER_SERVICE_URL",     "http://order-service:8004")
INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8002")
SHIPPING_SERVICE_URL  = os.getenv("SHIPPING_SERVICE_URL",  "http://shipping-service:8006")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# ─── Conversión COP → USD ─────────────────────────────────────────────────────
# Stripe no soporta COP. Usamos una tasa aproximada.
# En producción reemplazar con una API de cambio real.
COP_TO_USD_RATE = 4200  # 1 USD ≈ 4200 COP


def cop_to_usd_cents(amount_cop: float) -> int:
    """Convierte pesos colombianos a centavos de dólar para Stripe."""
    usd   = amount_cop / COP_TO_USD_RATE
    cents = int(round(usd * 100))
    return max(cents, 50)  # Stripe requiere mínimo 50 centavos USD


# ─── Stripe: Paso 1 — Crear PaymentIntent ─────────────────────────────────────

def create_payment_intent(amount_cop: float, order_id: int, user_id: int) -> dict:
    """
    Crea un PaymentIntent en Stripe y devuelve el client_secret.
    El frontend lo usa con stripe.confirmCardPayment(client_secret).
    """
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


# ─── Stripe: Paso 2 — Confirmar PaymentIntent ─────────────────────────────────

def confirm_payment_intent(payment_intent_id: str) -> dict:
    """
    Verifica con Stripe que el PaymentIntent fue confirmado exitosamente.
    Se llama DESPUÉS de que el frontend confirmó el pago.
    """
    if not stripe.api_key:
        return {"success": False, "reason": "STRIPE_SECRET_KEY no configurada en .env"}

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)

        if intent.status == "succeeded":
            return {
                "success":        True,
                "transaction_id": intent.id,
                "message":        "Pago confirmado exitosamente",
            }
        elif intent.status in ("requires_payment_method", "canceled"):
            return {
                "success": False,
                "reason":  f"Pago no completado — estado Stripe: {intent.status}",
            }
        else:
            return {
                "success": False,
                "reason":  f"Estado inesperado de Stripe: {intent.status}",
            }

    except stripe.error.InvalidRequestError as e:
        return {"success": False, "reason": f"PaymentIntent inválido: {str(e)}"}
    except stripe.error.StripeError as e:
        return {"success": False, "reason": f"Error de Stripe al confirmar: {str(e)}"}


# ─── Helpers de Saga ──────────────────────────────────────────────────────────

async def notify_order_payment_result(order_id: int, success: bool):
    """
    Saga: pago exitoso → orden 'confirmed'.
          pago fallido  → orden 'cancelled'.
    """
    new_status = "confirmed" if success else "cancelled"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.patch(
                f"{ORDER_SERVICE_URL}/orders/{order_id}/status",
                json={"status": new_status},
            )
    except Exception:
        pass  # No bloquear el flujo si order-service no responde


async def trigger_shipping_after_payment(
    order_id:       int,
    user_id:        int,
    email:          str,
    recipient_name: str,
    address:        str,
    city:           str,
    department:     str,
    postal_code:    str = "",
    country:        str = "Colombia",
    carrier:        str = "Servientrega",
):
    """Saga paso 4: después de confirmar el pago, crea el envío."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.post(
                f"{SHIPPING_SERVICE_URL}/shipping/",
                json={
                    "order_id":       order_id,
                    "user_id":        user_id,
                    "email":          email,
                    "recipient_name": recipient_name,
                    "address":        address,
                    "city":           city,
                    "department":     department,
                    "postal_code":    postal_code,
                    "country":        country,
                    "carrier":        carrier,
                },
            )
    except Exception:
        pass


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