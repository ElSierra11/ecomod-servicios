import paypalrestsdk
import os
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Payment

logger = logging.getLogger(__name__)

# Configurar PayPal
paypalrestsdk.configure({
    "mode": os.getenv("PAYPAL_MODE", "sandbox"),
    "client_id": os.getenv("PAYPAL_CLIENT_ID"),
    "client_secret": os.getenv("PAYPAL_SECRET_KEY"),
})

def create_paypal_payment(order_id: int, amount: float, return_url: str, cancel_url: str):
    """
    Crea un pago en PayPal y devuelve el ID de aprobación.
    """
    try:
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": return_url,
                "cancel_url": cancel_url
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": f"Orden #{order_id}",
                        "sku": f"ORDER_{order_id}",
                        "price": str(amount),
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": str(amount),
                    "currency": "USD"
                },
                "description": f"Pago de orden #{order_id}"
            }]
        })

        if payment.create():
            for link in payment.links:
                if link.rel == "approval_url":
                    return {
                        "success": True,
                        "payment_id": payment.id,
                        "approval_url": link.href
                    }
        else:
            logger.error(f"Error PayPal: {payment.error}")
            return {"success": False, "error": payment.error.get('message', 'Error al crear pago')}
    except Exception as e:
        logger.error(f"Excepción PayPal: {e}")
        return {"success": False, "error": str(e)}


def execute_paypal_payment(payment_id: str, payer_id: str, order_id: int = None):
    """
    Ejecuta un pago de PayPal después de la aprobación del usuario.
    Verifica si el pago ya fue procesado para evitar duplicados.
    """
    #VERIFICAR SI EL PAGO YA EXISTE EN NUESTRA BD
    if order_id:
        db = SessionLocal()
        try:
            existing_payment = db.query(Payment).filter(
                Payment.order_id == order_id,
                Payment.status == "succeeded"
            ).first()
            
            if existing_payment:
                logger.info(f"✅ Orden #{order_id} ya tiene pago exitoso - PayPal no se ejecuta nuevamente")
                return {
                    "success": True,
                    "transaction_id": existing_payment.transaction_id,
                    "status": "succeeded",
                    "already_processed": True
                }
        finally:
            db.close()
    
    try:
        # Buscar el pago en PayPal
        payment = paypalrestsdk.Payment.find(payment_id)
        
        # VERIFICAR SI EL PAGO YA FUE EJECUTADO EN PAYPAL
        if payment.state == "approved":
            logger.info(f"✅ Pago PayPal {payment_id} ya estaba aprobado")
            return {
                "success": True,
                "transaction_id": payment.id,
                "status": "succeeded",
                "already_processed": True
            }
        
        # Ejecutar el pago
        if payment.execute({"payer_id": payer_id}):
            return {
                "success": True,
                "transaction_id": payment.id,
                "status": "succeeded"
            }
        else:
            logger.error(f"Error al ejecutar pago: {payment.error}")
            return {"success": False, "error": payment.error.get('message', 'Error al ejecutar pago')}
            
    except paypalrestsdk.ResourceNotFound as e:
        logger.error(f"Pago no encontrado en PayPal: {e}")
        return {"success": False, "error": "Pago no encontrado en PayPal"}
    except Exception as e:
        logger.error(f"Excepción al ejecutar pago: {e}")
        return {"success": False, "error": str(e)}