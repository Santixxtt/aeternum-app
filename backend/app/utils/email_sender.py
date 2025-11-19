import logging
import os
import requests

logger = logging.getLogger(__name__)

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_NAME = os.getenv("SENDER_NAME")

def send_password_recovery_email(recipient_email: str, recovery_url: str, user_name: str = None):
    """
    Envía un correo electrónico usando la API de Brevo (no SMTP).
    """
    logger.info(f"📧 Preparando email para: {recipient_email}")
    logger.info(f"📡 Usando Brevo API (HTTP)")
    logger.info(f"👤 From: {SENDER_EMAIL}")
    
    # Si no hay nombre, usar la parte antes del @ del email
    if not user_name:
        user_name = recipient_email.split("@")[0].capitalize()
    
    html_content = f"""
    <html>
        <body>
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #B6407D;">Solicitud de Restablecimiento de Contraseña</h2>
                <p>Hola <strong>{user_name}</strong>,</p>
                <p>Recibimos una solicitud para restablecer la contraseña asociada a tu cuenta.</p>
                
                <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
                
                <p style="text-align: center;">
                    <a href="{recovery_url}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #B6407D; border-radius: 5px; text-decoration: none; font-weight: bold;">
                        Restablecer Contraseña
                    </a>
                </p>
                
                <p>Si no solicitaste este cambio, ignora este mensaje. Tu contraseña no cambiará hasta que accedas al enlace y crees una nueva.</p>
                
                <p style="font-size: 0.8em; color: #999;">El enlace caducará en 1 hora.</p>
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
                "name": user_name
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