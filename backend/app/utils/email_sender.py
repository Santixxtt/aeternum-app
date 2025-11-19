import logging
import os
import requests

logger = logging.getLogger(__name__)


BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_NAME = os.getenv("SENDER_NAME")

def send_password_recovery_email(recipient_email: str, recovery_url: str):
    """
    Envía un correo electrónico usando la API de Brevo (no SMTP).
    """
    logger.info(f"📧 Preparando email para: {recipient_email}")
    logger.info(f"📡 Usando Brevo API (HTTP)")
    logger.info(f"👤 From: {SENDER_EMAIL}")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }}
            .container {{ background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            .header {{ text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff; }}
            .button {{ background-color: #007bff; color: white !important; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }}
            .button:hover {{ background-color: #0056b3; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }}
            .warning {{ background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }}
            .danger {{ background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="color: #007bff; margin: 0;"> Aeternum</h2>
            </div>
            
            <h3 style="color: #333; margin-top: 25px;">Solicitud de Restablecimiento de Contraseña</h3>
            
            <p style="color: #555; line-height: 1.6;">
                Hola,<br><br>
                Recibimos una solicitud para restablecer la contraseña asociada a tu cuenta en Aeternum.
            </p>
            
            <p style="text-align: center; margin: 35px 0;">
                <a href="{recovery_url}" class="button">Restablecer mi Contraseña</a>
            </p>
            
            <p style="font-size: 13px; color: #666; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
                <strong>📎 Enlace alternativo:</strong><br>
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="{recovery_url}" style="color: #007bff; word-break: break-all;">{recovery_url}</a>
            </p>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este mensaje. 
                Tu contraseña no cambiará hasta que accedas al enlace y crees una nueva.
            </div>
            
            <div class="danger">
                <strong>⏱ Este enlace expirará en 1 hora</strong> por razones de seguridad.
            </div>
            
            <div class="footer">
                <p><strong>Aeternum</strong> - Sistema de Gestión</p>
                <p style="color: #999; font-size: 11px;">
                    Este es un correo automático, por favor no respondas a este mensaje.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Payload para la API de Brevo
    payload = {
        "sender": {
            "name": SENDER_NAME,
            "email": SENDER_EMAIL
        },
        "to": [
            {
                "email": recipient_email,
                "name": recipient_email.split("@")[0]
            }
        ],
        "subject": "Restablece tu contraseña de Aeternum",
        "htmlContent": html_content
    }
    
    # Validar que la API key existe
    if not BREVO_API_KEY or BREVO_API_KEY == "":
        error_msg = "BREVO_API_KEY no está configurada"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    logger.info(f"🔑 Usando API Key: {BREVO_API_KEY[:20]}...")
    
    try:
        logger.info("📤 Enviando email vía Brevo API...")
        
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 201:
            result = response.json()
            message_id = result.get("messageId", "N/A")
            logger.info(f"✅ Email enviado exitosamente. ID: {message_id}")
            return True, "Correo enviado exitosamente"
        else:
            error_msg = f"Error {response.status_code}: {response.text}"
            logger.error(f"❌ {error_msg}")
            return False, error_msg
    
    except requests.exceptions.Timeout as e:
        error_msg = f"Timeout en API: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except requests.exceptions.RequestException as e:
        error_msg = f"Error de red: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except Exception as e:
        error_msg = f"Error desconocido: {str(e)}"
        logger.error(f"❌ {error_msg}", exc_info=True)
        return False, error_msg