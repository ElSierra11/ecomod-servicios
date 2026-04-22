"""
Event Bus usando RabbitMQ para la Saga Coreografiada.
Cada microservicio importa este módulo para publicar y consumir eventos.

Eventos del sistema:
  order.created        → Order Service publica cuando crea una orden
  inventory.reserved   → Inventory Service publica cuando reserva stock
  inventory.failed     → Inventory Service publica cuando no hay stock
  payment.succeeded    → Payment Service publica cuando el pago es exitoso
  payment.failed       → Payment Service publica cuando el pago falla
  shipping.confirmed   → Shipping Service publica cuando crea el envío
  order.confirmed      → Order Service publica cuando confirma la orden
"""
import aio_pika
import asyncio
import json
import os
import logging

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
EXCHANGE_NAME = "ecomod.events"


async def get_connection():
    for attempt in range(10):
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            return connection
        except Exception as e:
            logger.warning(f"RabbitMQ no disponible (intento {attempt+1}/10): {e}")
            await asyncio.sleep(3)
    raise Exception("No se pudo conectar a RabbitMQ después de 10 intentos")


async def publish_event(event_type: str, payload: dict):
    """
    Publica un evento en el exchange de EcoMod.
    
    Ejemplo:
        await publish_event("order.created", {"order_id": 1, "user_id": 5, ...})
    """
    try:
        connection = await get_connection()
        async with connection:
            channel = await connection.channel()
            exchange = await channel.declare_exchange(
                EXCHANGE_NAME,
                aio_pika.ExchangeType.TOPIC,
                durable=True
            )
            message = aio_pika.Message(
                body=json.dumps({
                    "event": event_type,
                    "data": payload
                }).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json"
            )
            await exchange.publish(message, routing_key=event_type)
            logger.info(f"Evento publicado: {event_type} → {payload}")
    except Exception as e:
        logger.error(f"Error publicando evento {event_type}: {e}")


async def subscribe_events(routing_keys: list, callback, queue_name: str):
    try:
        connection = await get_connection()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=10)

        exchange = await channel.declare_exchange(
            EXCHANGE_NAME,
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

        queue = await channel.declare_queue(queue_name, durable=True)

        for key in routing_keys:
            await queue.bind(exchange, routing_key=key)
            logger.info(f"Suscrito a: {key} en cola {queue_name}")

        async def process_message(message: aio_pika.IncomingMessage):
            async with message.process():
                try:
                    body = json.loads(message.body.decode())
                    event_type = body.get("event")
                    data = body.get("data", {})
                    logger.info(f"Evento recibido: {event_type}")
                    await callback(event_type, data)
                except Exception as e:
                    logger.error(f"Error procesando mensaje: {e}")

        await queue.consume(process_message)
        logger.info(f"Consumiendo cola: {queue_name}")

        # Mantener la conexión viva
        await asyncio.Future()

    except Exception as e:
        logger.error(f"Error en subscribe_events: {e}")