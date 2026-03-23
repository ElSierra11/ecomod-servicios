import httpx
import os

NOTIFICATION_SERVICE_URL = os.getenv(
    "NOTIFICATION_SERVICE_URL",
    "http://notification-service:8007"
)


async def notify_shipment_created(shipment_id: int, order_id: int, user_id: int, email: str, tracking: str, carrier: str, estimated: str):
    """Notifica al usuario cuando su envío es creado."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications/events/shipment-created",
                json={
                    "shipment_id": shipment_id,
                    "order_id": order_id,
                    "user_id": user_id,
                    "email": email,
                    "tracking_number": tracking,
                    "carrier": carrier,
                    "estimated_delivery": estimated,
                }
            )
    except Exception:
        pass


async def notify_shipment_delivered(shipment_id: int, order_id: int, user_id: int, email: str, tracking: str):
    """Notifica al usuario cuando su pedido es entregado."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications/events/shipment-delivered",
                json={
                    "shipment_id": shipment_id,
                    "order_id": order_id,
                    "user_id": user_id,
                    "email": email,
                    "tracking_number": tracking,
                }
            )
    except Exception:
        pass