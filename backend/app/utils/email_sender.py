import logging
import os
import resend

logger = logging.getLogger(__name__)

# 🔥 Configura tu API key de Resend
resend.api_key = os.getenv("RESEND_API_KEY", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")  # Usa el dominio verificado

def send_password_recovery_email(recipient_email: str, recovery_url: str):
    """
    Envía un correo electrónico con el enlace de recuperación de contraseña usando Resend.
    """
    logger.info(f"📧 Preparando email para: {recipient_email}")
    logger.info(f"📡 Usando Resend API")
    logger.info(f"👤 From: {SENDER_EMAIL}")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }}
            .container {{ background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto; }}
            .button {{ background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }}
            .footer {{ margin-top: 30px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2> Solicitud de Restablecimiento de Contraseña</h2>
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer la contraseña asociada a este correo.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{recovery_url}" class="button">Restablecer Contraseña</a>
            </p>
            <p style="font-size: 12px; color: #666;">
                O copia este enlace en tu navegador:<br>
                <a href="{recovery_url}">{recovery_url}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
                 Si no solicitaste este cambio, ignora este mensaje. Tu contraseña no cambiará 
                hasta que accedas al enlace y crees una nueva.
            </p>
            <p style="color: #e74c3c; font-weight: bold;">
                ⏱️ El enlace caducará en 1 hora.
            </p>
            <div class="footer">
                <p>Aeternum - Sistema de Gestión</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        logger.info("📤 Enviando email con Resend...")
        
        params = {
            "from": SENDER_EMAIL,
            "to": [recipient_email],
            "subject": "Restablece tu contraseña de Aeternum",
            "html": html_content,
        }
        
        email = resend.Emails.send(params)
        
        logger.info(f"✅ Email enviado exitosamente. ID: {email.get('id', 'N/A')}")
        return True, "Correo enviado exitosamente"
    
    except resend.exceptions.ResendError as e:
        error_msg = f"Error de Resend: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except Exception as e:
        error_msg = f"Error desconocido: {str(e)}"
        logger.error(f"❌ {error_msg}", exc_info=True)
        return False, error_msg