import httpx
import os
from typing import List
from app.schemas import OrderItemCreate

# URL interna del inventory-service dentro de la red Docker
INVENTORY_SERVICE_URL = os.getenv(
    "INVENTORY_SERVICE_URL",
    "http://inventory-service:8002"
)


async def reserve_stock_for_order(items: List[OrderItemCreate]) -> dict:
    """
    Saga paso 2: reservar stock en inventory-service para cada item.
    Si algún item falla, libera todo lo reservado (rollback).
    Retorna: {"success": True/False, "failed_product_id": int|None, "reserved": []}
    """
    reserved = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        for item in items:
            try:
                response = await client.post(
                    f"{INVENTORY_SERVICE_URL}/inventory/reserve",
                    json={
                        "product_id": item.product_id,
                        "quantity": item.quantity
                    }
                )
                data = response.json()

                if not data.get("success", False):
                    # Stock insuficiente — liberar todo lo reservado hasta ahora
                    await release_stock(client, reserved)
                    return {
                        "success": False,
                        "failed_product_id": item.product_id,
                        "message": data.get("message", "Stock insuficiente"),
                        "reserved": reserved
                    }

                reserved.append({
                    "product_id": item.product_id,
                    "quantity": item.quantity
                })

            except httpx.RequestError as e:
                # Error de conexión con inventory-service
                await release_stock(client, reserved)
                return {
                    "success": False,
                    "failed_product_id": item.product_id,
                    "message": f"Error contactando inventory-service: {str(e)}",
                    "reserved": reserved
                }

    return {
        "success": True,
        "failed_product_id": None,
        "message": "Stock reservado correctamente",
        "reserved": reserved
    }


async def release_stock(client: httpx.AsyncClient, reserved: list):
    """
    Saga rollback: liberar stock reservado si algo falla.
    """
    for item in reserved:
        try:
            await client.post(
                f"{INVENTORY_SERVICE_URL}/inventory/release",
                json={
                    "product_id": item["product_id"],
                    "quantity": item["quantity"]
                }
            )
        except Exception:
            pass


async def release_order_stock(items: List) -> bool:
    """
    Liberar el stock de una orden completa (cuando se cancela).
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        for item in items:
            try:
                await client.post(
                    f"{INVENTORY_SERVICE_URL}/inventory/release",
                    json={
                        "product_id": item.product_id,
                        "quantity": item.quantity
                    }
                )
            except Exception:
                pass
    return True