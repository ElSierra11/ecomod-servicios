import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST  = os.getenv("SMTP_HOST", "")
SMTP_PORT  = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER  = os.getenv("SMTP_USER", "")
SMTP_PASS  = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@ecomod.com")
FROM_NAME  = os.getenv("FROM_NAME",  "EcoMod")


def send_email(to_email: str, subject: str, html_body: str) -> dict:
    if not SMTP_HOST or not SMTP_USER:
        print(f"[EMAIL SIMULADO] Para: {to_email} | Asunto: {subject}")
        return {"success": True, "simulated": True}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"]      = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        return {"success": True, "simulated": False}
    except Exception as e:
        return {"success": False, "error": str(e)}


def build_order_confirmed_email(order_id: int, total: float, items: int) -> dict:
    return {
        "subject": f"✅ Orden #{order_id} confirmada — EcoMod",
        "body": f"""
        <h2>¡Tu orden fue confirmada!</h2>
        <p>Orden <strong>#{order_id}</strong> — Total: <strong>${total:,.0f}</strong></p>
        <p>{items} producto(s) reservados en inventario.</p>
        <p>Procede al pago para completar tu compra.</p>
        """
    }


# FIX: email propio para orden cancelada
def build_order_cancelled_email(order_id: int, reason: str) -> dict:
    return {
        "subject": f"❌ Orden #{order_id} cancelada — EcoMod",
        "body": f"""
        <h2>Tu orden fue cancelada</h2>
        <p>La orden <strong>#{order_id}</strong> fue cancelada.</p>
        <p>Motivo: {reason}</p>
        <p>Si crees que esto es un error, contáctanos.</p>
        """
    }


def build_payment_succeeded_email(order_id: int, amount: float, txn: str) -> dict:
    return {
        "subject": f"💳 Pago confirmado para la orden #{order_id} — EcoMod",
        "body": f"""
        <h2>¡Pago recibido!</h2>
        <p>Tu pago de <strong>${amount:,.0f}</strong> fue procesado exitosamente.</p>
        <p>Orden <strong>#{order_id}</strong> — Transacción: <code>{txn}</code></p>
        <p>Tu pedido está siendo preparado para envío.</p>
        """
    }


def build_payment_failed_email(order_id: int, reason: str) -> dict:
    return {
        "subject": f"❌ Pago fallido para la orden #{order_id} — EcoMod",
        "body": f"""
        <h2>Problema con tu pago</h2>
        <p>El pago para la orden <strong>#{order_id}</strong> no pudo procesarse.</p>
        <p>Razón: {reason}</p>
        <p>Por favor intenta nuevamente con otro método de pago.</p>
        """
    }


def build_shipment_created_email(order_id: int, tracking: str, carrier: str, delivery: str) -> dict:
    return {
        "subject": f"🚚 Tu pedido está en camino — Orden #{order_id}",
        "body": f"""
        <h2>¡Tu pedido fue enviado!</h2>
        <p>Orden <strong>#{order_id}</strong></p>
        <p>Transportista: <strong>{carrier}</strong></p>
        <p>Número de tracking: <code>{tracking}</code></p>
        <p>Entrega estimada: {delivery}</p>
        """
    }


def build_shipment_delivered_email(order_id: int, tracking: str) -> dict:
    return {
        "subject": f"📦 Pedido entregado — Orden #{order_id}",
        "body": f"""
        <h2>¡Tu pedido fue entregado!</h2>
        <p>La orden <strong>#{order_id}</strong> fue entregada exitosamente.</p>
        <p>Tracking: <code>{tracking}</code></p>
        <p>¡Gracias por comprar en EcoMod!</p>
        """
    }