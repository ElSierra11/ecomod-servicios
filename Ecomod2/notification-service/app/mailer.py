import os
import logging
import httpx

logger = logging.getLogger(__name__)

# ─── Configuración de Email ───
# Prioridad: Brevo API (HTTP) > SMTP (bloqueado en Render free tier)
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
SMTP_HOST  = os.getenv("SMTP_HOST", "")
SMTP_PORT  = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER  = os.getenv("SMTP_USER", "")
SMTP_PASS  = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@ecomod.com")
FROM_NAME  = os.getenv("FROM_NAME",  "EcoMod")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")


def send_email(to_email: str, subject: str, html_body: str) -> dict:
    """Envía email usando Brevo API (HTTP) o SMTP como fallback."""

    # Método 1: Brevo API (funciona en Render, no depende de SMTP)
    if BREVO_API_KEY:
        return _send_via_brevo(to_email, subject, html_body)

    # Método 2: SMTP directo (bloqueado en Render free tier)
    if SMTP_HOST and SMTP_USER:
        return _send_via_smtp(to_email, subject, html_body)

    # Sin configuración — simular
    logger.warning(f"[EMAIL SIMULADO] Para: {to_email} | Asunto: {subject}")
    return {"success": True, "simulated": True}


def _send_via_brevo(to_email: str, subject: str, html_body: str) -> dict:
    """Envía email usando la API HTTP de Brevo (Sendinblue)."""
    try:
        response = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "accept": "application/json",
            },
            json={
                "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html_body,
            },
            timeout=15.0,
        )
        if response.status_code in (200, 201):
            logger.info(f"✅ Email enviado via Brevo a {to_email}")
            return {"success": True, "simulated": False, "provider": "brevo"}
        else:
            error_msg = f"Brevo API error {response.status_code}: {response.text}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
    except Exception as e:
        logger.error(f"❌ Error enviando email via Brevo: {e}")
        return {"success": False, "error": str(e)}


def _send_via_smtp(to_email: str, subject: str, html_body: str) -> dict:
    """Envía email usando SMTP directo (puede estar bloqueado en Render)."""
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"]      = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        logger.info(f"✅ Email enviado via SMTP a {to_email}")
        return {"success": True, "simulated": False, "provider": "smtp"}
    except Exception as e:
        logger.error(f"❌ Error enviando email via SMTP: {e}")
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
                <p>&copy; 2026 EcoMod E-commerce Ecosystem. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no respondas.</p>
            </div>
        </div>
    </body>
    </html>
    """


def build_payment_succeeded_email(order_id: int, amount: float, transaction_id: str) -> dict:
    content = f"""
        <h1 style="color: #10b981;">¡Pago confirmado! 💳</h1>
        <p>Hemos recibido correctamente tu pago. Tu pedido ya está en manos de nuestro equipo de logística.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; border: 1px solid #bbf7d0; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Orden:</strong> #{order_id}</p>
            <p style="margin: 5px 0;"><strong>Monto:</strong> ${amount:,.0f}</p>
            <p style="margin: 5px 0;"><strong>Transacción:</strong> <code style="color: #059669;">{transaction_id}</code></p>
        </div>
        <p>Te avisaremos en cuanto tu paquete salga de nuestra bodega.</p>
        <a href="{FRONTEND_URL}/orders" class="btn">Seguir Pedido</a>
    """
    return {"subject": f"💳 Pago confirmado — Orden #{order_id} — EcoMod", "body": get_html_layout(content)}


def build_payment_failed_email(order_id: int, reason: str) -> dict:
    content = f"""
        <h1 style="color: #ef4444;">Pago no procesado ❌</h1>
        <p>Tu pago para la orden <strong>#{order_id}</strong> no pudo ser procesado.</p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 10px; border: 1px solid #fecaca; margin: 20px 0;">
            <p><strong>Motivo:</strong> {reason}</p>
        </div>
        <p>Puedes intentar de nuevo con otro método de pago.</p>
        <a href="{FRONTEND_URL}/payments" class="btn">Reintentar Pago</a>
    """
    return {"subject": f"❌ Pago no procesado — Orden #{order_id} — EcoMod", "body": get_html_layout(content)}


def build_order_confirmed_email(order_id: int) -> dict:
    content = f"""
        <h1 style="color: #10b981;">¡Pedido confirmado! ✅</h1>
        <p>Tu pedido <strong>#{order_id}</strong> ha sido confirmado y está siendo preparado.</p>
        <a href="{FRONTEND_URL}/orders" class="btn">Ver Mi Pedido</a>
    """
    return {"subject": f"✅ Pedido #{order_id} confirmado — EcoMod", "body": get_html_layout(content)}


def build_shipment_created_email(order_id: int, tracking: str, carrier: str) -> dict:
    content = f"""
        <h1 style="color: #3b82f6;">¡Tu pedido va en camino! 🚚</h1>
        <p>Tu pedido <strong>#{order_id}</strong> ha sido despachado.</p>
        <div style="background: #eff6ff; padding: 15px; border-radius: 10px; border: 1px solid #bfdbfe; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Transportadora:</strong> {carrier}</p>
            <p style="margin: 5px 0;"><strong>Código de rastreo:</strong> <code style="color: #2563eb;">{tracking}</code></p>
        </div>
        <a href="{FRONTEND_URL}/shipping" class="btn">Rastrear Envío</a>
    """
    return {"subject": f"🚚 Pedido #{order_id} en camino — EcoMod", "body": get_html_layout(content)}


def build_welcome_email(nombre: str) -> dict:
    content = f"""
        <h1 style="color: #e8291c;">¡Bienvenido a EcoMod, {nombre}! 🎉</h1>
        <p>Tu cuenta ha sido creada exitosamente. Ya puedes explorar nuestro catálogo de productos modulares.</p>
        <a href="{FRONTEND_URL}" class="btn">Explorar Catálogo</a>
    """
    return {"subject": f"🎉 Bienvenido a EcoMod, {nombre}!", "body": get_html_layout(content)}


def build_password_reset_email(reset_link: str) -> dict:
    content = f"""
        <h1 style="color: #f59e0b;">Restablecer contraseña 🔑</h1>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar:</p>
        <a href="{reset_link}" class="btn">Restablecer Contraseña</a>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">Si no solicitaste esto, ignora este correo.</p>
    """
    return {"subject": "🔑 Restablecer contraseña — EcoMod", "body": get_html_layout(content)}


def build_shipment_delivered_email(order_id: int, tracking: str) -> dict:
    content = f"""
        <h1 style="color: #10b981;">¡Pedido entregado! 📦✅</h1>
        <p>Tu pedido <strong>#{order_id}</strong> ha sido entregado exitosamente.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; border: 1px solid #bbf7d0; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Código de rastreo:</strong> <code style="color: #059669;">{tracking}</code></p>
        </div>
        <p>¡Gracias por comprar en EcoMod! Esperamos que disfrutes tu compra.</p>
        <a href="{FRONTEND_URL}/orders" class="btn">Ver Mis Pedidos</a>
    """
    return {"subject": f"📦 Pedido #{order_id} entregado — EcoMod", "body": get_html_layout(content)}