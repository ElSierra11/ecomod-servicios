import httpx
import os
import stripe

ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8004")
INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8002")

# Clave secreta de Stripe — viene de variable de entorno
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")


def process_payment_stripe(amount: float, payment_method_id: str) -> dict:
    """
    Procesa un pago real con Stripe.

    En el frontend usa Stripe.js para tokenizar la tarjeta
    y obtener el payment_method_id (empieza con 'pm_...').

    Tarjetas de prueba Stripe:
    - pm_card_visa             → pago exitoso
    - pm_card_mastercard       → pago exitoso
    - pm_card_chargeDeclined   → pago rechazado
    - pm_card_insufficientFunds → fondos insuficientes
    """
    if not stripe.api_key:
        return simulate_payment_fallback(amount, payment_method_id)

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount),
            currency="cop",
            payment_method=payment_method_id,
            confirm=True,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never"
            }
        )

        if intent.status == "succeeded":
            return {
                "success": True,
                "transaction_id": intent.id,
                "message": "Pago procesado exitosamente"
            }
        else:
            return {
                "success": False,
                "reason": f"Estado inesperado de Stripe: {intent.status}"
            }

    except stripe.error.CardError as e:
        return {"success": False, "reason": f"Tarjeta rechazada: {e.user_message}"}
    except stripe.error.InvalidRequestError as e:
        return {"success": False, "reason": f"Error en la solicitud: {str(e)}"}
    except stripe.error.AuthenticationError:
        return {"success": False, "reason": "Error de autenticación con Stripe — verifica STRIPE_SECRET_KEY"}
    except stripe.error.StripeError as e:
        return {"success": False, "reason": f"Error de Stripe: {str(e)}"}


def simulate_payment_fallback(amount: float, payment_method: str) -> dict:
    """Fallback cuando no hay clave de Stripe — útil para desarrollo."""
    import random, uuid

    if amount <= 0:
        return {"success": False, "reason": "Monto inválido"}
    if payment_method in ("test_fail", "pm_card_chargeDeclined"):
        return {"success": False, "reason": "Pago rechazado por la pasarela"}
    if payment_method == "pm_card_insufficientFunds":
        return {"success": False, "reason": "Fondos insuficientes"}

    success = random.random() > 0.1
    if success:
        return {"success": True, "transaction_id": f"TXN-{uuid.uuid4().hex[:16].upper()}"}
    return {"success": False, "reason": "Pago rechazado (simulación)"}


async def process_payment(amount: float, payment_method: str) -> dict:
    """
    Función principal.
    - Si payment_method empieza con 'pm_' → Stripe real
    - Si no → simulación (card, nequi, daviplata, test_fail)
    """
    if payment_method.startswith("pm_"):
        return process_payment_stripe(amount, payment_method)
    return simulate_payment_fallback(amount, payment_method)


async def notify_order_payment_result(order_id: int, success: bool):
    new_status = "shipped" if success else "cancelled"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.patch(
                f"{ORDER_SERVICE_URL}/orders/{order_id}/status",
                json={"status": new_status}
            )
    except Exception:
        pass


async def release_inventory_on_failure(order_items: list):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for item in order_items:
                await client.post(
                    f"{INVENTORY_SERVICE_URL}/inventory/release",
                    json={"product_id": item["product_id"], "quantity": item["quantity"]}
                )
    except Exception:
        pass