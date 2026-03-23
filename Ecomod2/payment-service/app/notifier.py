import httpx
import os

NOTIFICATION_SERVICE_URL = os.getenv(
    "NOTIFICATION_SERVICE_URL",
    "http://notification-service:8007"
)


async def notify_payment_succeeded(payment_id: int, order_id: int, user_id: int, email: str, amount: float, transaction_id: str):
    """Notifica al usuario cuando su pago es exitoso."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications/events/payment-succeeded",
                json={
                    "payment_id": payment_id,
                    "order_id": order_id,
                    "user_id": user_id,
                    "email": email,
                    "amount": amount,
                    "transaction_id": transaction_id,
                }
            )
    except Exception:
        pass


async def notify_payment_failed(payment_id: int, order_id: int, user_id: int, email: str, reason: str):
    """Notifica al usuario cuando su pago falla."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications/events/payment-failed",
                json={
                    "payment_id": payment_id,
                    "order_id": order_id,
                    "user_id": user_id,
                    "email": email,
                    "reason": reason,
                }
            )
    except Exception:
        pass