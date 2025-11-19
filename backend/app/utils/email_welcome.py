import logging
import os
import requests

logger = logging.getLogger(__name__)

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_NAME = os.getenv("SENDER_NAME")

def send_verification_email(recipient_email: str, verification_url: str, user_name: str = None):
    """
    Envía un correo electrónico de verificación usando la API de Brevo.
    """
    logger.info(f"📧 Preparando email de verificación para: {recipient_email}")
    
    if not user_name:
        user_name = recipient_email.split("@")[0].capitalize()
    
    html_content = f"""
    <html>
        <body>
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #B6407D;">¡Bienvenido a Aeternum!</h2>
                <p>Hola <strong>{user_name}</strong>,</p>
                <p>Gracias por registrarte en <strong>Aeternum</strong>. Para completar tu registro, necesitamos verificar tu correo electrónico.</p>
                
                <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>
                
                <p style="text-align: center;">
                    <a href="{verification_url}" style="display: inline-block; padding: 15px 30px; color: white; background-color: #B6407D; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 16px;">
                        Verificar mi cuenta
                    </a>
                </p>
                
                <p style="margin-top: 20px;">O copia y pega este enlace en tu navegador:</p>
                <p style="font-size: 12px; word-break: break-all; color: #666;">{verification_url}</p>
                
                <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
                
                <p style="font-size: 0.8em; color: #999; margin-top: 30px;">
                    Este enlace expirará en 24 horas por seguridad.
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                
                <p style="font-size: 0.8em; color: #999; text-align: center;">
                    © 2025 Aeternum. Todos los derechos reservados.
                </p>
            </div>
        </body>
    </html>
    """
    
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
        "subject": "Verifica tu cuenta de Aeternum",
        "htmlContent": html_content
    }
    
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
        logger.info("📤 Enviando email de verificación vía Brevo API...")
        
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 201:
            result = response.json()
            message_id = result.get("messageId", "N/A")
            logger.info(f"✅ Email de verificación enviado exitosamente. ID: {message_id}")
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