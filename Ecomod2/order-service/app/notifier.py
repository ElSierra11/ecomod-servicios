import httpx
import os

NOTIFICATION_SERVICE_URL = os.getenv(
    "NOTIFICATION_SERVICE_URL",
    "http://notification-service:8007"
)


async def notify_order_confirmed(order_id: int, user_id: int, email: str, total: float, items_count: int):
    """Notifica al usuario cuando su orden es confirmada."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications/events/order-confirmed",
                json={
                    "order_id": order_id,
                    "user_id": user_id,
                    "email": email,
                    "total_amount": total,
                    "items_count": items_count,
                }
            )
    except Exception:
        pass  # Notificaciones no bloquean el flujo principal


async def notify_order_cancelled(order_id: int, user_id: int, email: str, reason: str):
    """Notifica al usuario cuando su orden es cancelada."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications/events/payment-failed",
                json={
                    "payment_id": 0,
                    "order_id": order_id,
                    "user_id": user_id,
                    "email": email,
                    "reason": reason,
                }
            )
    except Exception:
        pass