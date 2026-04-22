import httpx
import os

NOTIFICATION_SERVICE_URL = os.getenv(
    "NOTIFICATION_SERVICE_URL",
    "http://notification-service:8007"
)


async def notify_order_confirmed(order_id: int, user_id: int, email: str, total: float, items_count: int):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications/events/order-confirmed",
                json={
                    "order_id":     order_id,
                    "user_id":      user_id,
                    "email":        email,
                    "total_amount": total,
                    "items_count":  items_count,
                }
            )
    except Exception:
        pass


#usa el endpoint correcto /order-cancelled con su propio evento
async def notify_order_cancelled(order_id: int, user_id: int, email: str, reason: str):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications/events/order-cancelled",
                json={
                    "order_id": order_id,
                    "user_id":  user_id,
                    "email":    email,
                    "reason":   reason,
                }
            )
    except Exception:
        pass