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
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")


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


def get_html_layout(content: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .email-body {{ font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; }}
            .header {{ text-align: center; padding-bottom: 20px; border-bottom: 2px solid #e8291c; }}
            .logo {{ font-size: 28px; font-weight: bold; color: #e8291c; text-decoration: none; }}
            .content {{ padding: 20px 0; }}
            .footer {{ text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }}
            .btn {{ display: inline-block; padding: 12px 24px; background-color: #e8291c; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }}
            .pill {{ background: #f3f4f6; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }}
        </style>
    </head>
    <body>
        <div class="email-body">
            <div class="header">
                <a href="#" class="logo">EcoMod</a>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                <p>&copy; {datetime.now().year} EcoMod E-commerce Ecosystem. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no respondas.</p>
            </div>
        </div>
    </body>
    </html>
    """

from datetime import datetime

def build_order_confirmed_email(order_id: int, total: float, items: int) -> dict:
    content = f"""
        <h1 style="color: #111;">¡Tu orden ha sido recibida! 🚀</h1>
        <p>Hola, estamos procesando tu pedido y pronto estará listo para envío.</p>
        <div style="background: #fafafa; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Orden:</strong> #{order_id}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> ${total:,.0f}</p>
            <p style="margin: 5px 0;"><strong>Items:</strong> {items}</p>
        </div>
        <p>Tu inventario ha sido reservado. Por favor, completa el pago para proceder con el envío.</p>
        <a href="{FRONTEND_URL}/orders" class="btn">Ver mi pedido</a>
    """
    return {
        "subject": f"✅ Orden #{order_id} recibida — EcoMod",
        "body": get_html_layout(content)
    }

def build_payment_succeeded_email(order_id: int, amount: float, txn: str) -> dict:
    content = f"""
        <h1 style="color: #10b981;">¡Pago confirmado! 💳</h1>
        <p>Hemos recibido correctamente tu pago. Tu pedido ya está en manos de nuestro equipo de logística.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; border: 1px solid #bbf7d0; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Orden:</strong> #{order_id}</p>
            <p style="margin: 5px 0;"><strong>Monto:</strong> ${amount:,.0f}</p>
            <p style="margin: 5px 0;"><strong>Transacción:</strong> <code style="color: #059669;">{txn}</code></p>
        </div>
        <p>Te avisaremos en cuanto tu paquete salga de nuestra bodega.</p>
        <a href="{FRONTEND_URL}/orders" class="btn">Seguir Pedido</a>
    """
    return {
        "subject": f"💳 Pago confirmado — Orden #{order_id} — EcoMod",
        "body": get_html_layout(content)
    }

def build_payment_failed_email(order_id: int, reason: str) -> dict:
    content = f"""
        <h1 style="color: #ef4444;">Problema con tu pago ❌</h1>
        <p>Lamentablemente, el pago para tu orden #{order_id} no pudo ser procesado.</p>
        <p style="color: #b91c1c; font-weight: bold;">Motivo: {reason}</p>
        <p>No te preocupes, tus productos siguen reservados. Puedes intentar el pago nuevamente con otro método.</p>
        <a href="{FRONTEND_URL}/orders" class="btn">Reintentar Pago</a>
    """
    return {
        "subject": f"⚠️ Pago fallido — Orden #{order_id} — EcoMod",
        "body": get_html_layout(content)
    }

def build_shipment_created_email(order_id: int, tracking: str, carrier: str, delivery: str) -> dict:
    content = f"""
        <h1 style="color: #111;">¡Tu pedido está en camino! 🚚</h1>
        <p>Tu paquete ha sido entregado a la transportadora y está viajando hacia ti.</p>
        <div style="background: #fafafa; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Tracking:</strong> <span class="pill">{tracking}</span></p>
            <p style="margin: 5px 0;"><strong>Transportadora:</strong> {carrier}</p>
            <p style="margin: 5px 0;"><strong>Entrega estimada:</strong> {delivery}</p>
        </div>
        <p>Puedes rastrear tu envío en tiempo real desde tu panel.</p>
        <a href="{FRONTEND_URL}/shipping" class="btn">Rastrear Envío</a>
    """
    return {
        "subject": f"🚚 Pedido en camino — Orden #{order_id} — EcoMod",
        "body": get_html_layout(content)
    }

def build_shipment_delivered_email(order_id: int, tracking: str) -> dict:
    content = f"""
        <h1 style="color: #111;">¡Entregado! 📦</h1>
        <p>Tu orden #{order_id} ha sido entregada satisfactoriamente.</p>
        <p>Esperamos que disfrutes tus productos EcoMod. ¡Gracias por confiar en nosotros!</p>
        <p style="font-size: 14px; color: #666;">Número de guía: {tracking}</p>
        <a href="{FRONTEND_URL}/catalog" class="btn">Seguir Comprando</a>
    """
    return {
        "subject": f"📦 Pedido entregado — Orden #{order_id} — EcoMod",
        "body": get_html_layout(content)
    }