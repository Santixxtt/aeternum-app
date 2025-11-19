import logging
import os
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_NAME = os.getenv("SENDER_NAME")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://aeternum-app-production.up.railway.app")


async def send_cuenta_bloqueada_mora(
    recipient_email: str,
    nombre_usuario: str,
    libros_vencidos: list,
    dias_mora: int
):
    """
    Envía un correo notificando que la cuenta fue bloqueada por mora
    
    Args:
        recipient_email: Correo del usuario
        nombre_usuario: Nombre completo del usuario
        libros_vencidos: Lista de dicts con {titulo, fecha_devolucion}
        dias_mora: Días transcurridos desde el vencimiento más antiguo
    """
    
    subject = "⛔ Cuenta bloqueada - Préstamos vencidos - Biblioteca Aeternum"
    
    # Generar lista de libros vencidos
    libros_html = ""
    for libro in libros_vencidos:
        libros_html += f"""
        <li style="margin: 10px 0; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <strong>{libro['titulo']}</strong><br>
            <small style="color: #856404;">Fecha límite: {libro['fecha_devolucion']}</small>
        </li>
        """
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; }}
            .content {{ padding: 30px; color: #333; }}
            .warning-box {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            .book-list {{ list-style: none; padding: 0; margin: 20px 0; }}
            .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }}
            .button {{ display: inline-block; background: #B6407D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⛔ Cuenta Bloqueada Temporalmente</h1>
            </div>
            <div class="content">
                <p>Hola <strong>{nombre_usuario}</strong>,</p>
                
                <div class="warning-box">
                    <strong>Tu cuenta ha sido bloqueada temporalmente</strong> debido a préstamos vencidos.
                </div>
                
                <p>Tienes <strong>{len(libros_vencidos)} libro(s)</strong> con mora de <strong>{dias_mora} día(s)</strong>:</p>
                
                <ul class="book-list">
                    {libros_html}
                </ul>
                
                <h3 style="color: #dc3545;">¿Qué debes hacer?</h3>
                <ol style="line-height: 1.8;">
                    <li>Devuelve los libros pendientes lo antes posible</li>
                    <li>Contacta a la biblioteca si necesitas renovar el préstamo</li>
                    <li>Una vez devueltos, el bibliotecario activará tu cuenta al instante</li>
                </ol>
                
                <p style="margin-top: 30px;">
                    <strong>Información de contacto:</strong><br>
                    Email: aeternum538@gmail.com<br>
                    Teléfono: (601) 123-4567<br>
                </p>
                
                <div style="text-align: center;">
                    <a href="{FRONTEND_URL}/loyout_user/mis-prestamos" class="button">
                        Ver Mis Préstamos
                    </a>
                </div>
            </div>
            <div class="footer">
                <p>Este es un correo automático, por favor no responder.</p>
                <p>© {datetime.now().year} Biblioteca Aeternum - Sistema de Gestión</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await _send_email_brevo(recipient_email, subject, html_body, nombre_usuario)


async def _send_email_brevo(recipient_email: str, subject: str, html_content: str, user_name: str = None):
    """Envía email usando la API de Brevo"""
    
    logger.info(f"📧 Enviando email de bloqueo a: {recipient_email}")
    
    if not user_name:
        user_name = recipient_email.split("@")[0].capitalize()
    
    payload = {
        "sender": {
            "name": SENDER_NAME,
            "email": SENDER_EMAIL
        },
        "to": [
            {
                "email": recipient_email,
                "name": user_name
            }
        ],
        "subject": subject,
        "htmlContent": html_content
    }
    
    if not BREVO_API_KEY:
        logger.error("❌ BREVO_API_KEY no está configurada")
        return False
    
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 201:
            result = response.json()
            message_id = result.get("messageId", "N/A")
            logger.info(f"✅ Correo de bloqueo enviado. ID: {message_id}")
            return True
        else:
            error_msg = f"Error {response.status_code}: {response.text}"
            logger.error(f"❌ {error_msg}")
            return False
    
    except Exception as e:
        logger.error(f"❌ Error enviando correo de bloqueo: {e}")
        return False