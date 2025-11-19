import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import os

logger = logging.getLogger(__name__)

# 🔥 USA VARIABLES DE ENTORNO (importante para Railway)
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "aeternum538@gmail.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "wuby uikp lilt rfkq")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))

def send_password_recovery_email(recipient_email: str, recovery_url: str):
    """
    Envía un correo electrónico con el enlace de recuperación de contraseña.
    """
    logger.info(f"📧 Preparando email para: {recipient_email}")
    logger.info(f"📡 SMTP Config: {SMTP_HOST}:{SMTP_PORT}")
    logger.info(f"👤 From: {SENDER_EMAIL}")
    
    subject = "Restablece tu contraseña de Aeternum"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }}
            .container {{ background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto; }}
            .button {{ background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Solicitud de Restablecimiento de Contraseña</h2>
            <p>Recibimos una solicitud para restablecer la contraseña asociada a este correo.</p>
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <p><a href="{recovery_url}" class="button">Restablecer Contraseña</a></p>
            <p>O copia este enlace: {recovery_url}</p>
            <p>Si no solicitaste este cambio, ignora este mensaje. Tu contraseña no cambiará hasta que accedas al enlace y crees una nueva.</p>
            <p><strong>El enlace caducará en 1 hora.</strong></p>
        </div>
    </body>
    </html>
    """
    
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = SENDER_EMAIL
    message["To"] = recipient_email
    
    part = MIMEText(html_content, "html")
    message.attach(part)
    
    try:
        logger.info("🔌 Conectando a servidor SMTP...")
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            logger.info("✅ Conectado a SMTP")
            
            logger.info("🔐 Autenticando...")
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            logger.info("✅ Autenticación exitosa")
            
            logger.info("📤 Enviando email...")
            server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
            logger.info("✅ Email enviado exitosamente")
        
        return True, "Correo enviado exitosamente"
    
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"Error de autenticación SMTP: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except smtplib.SMTPServerDisconnected as e:
        error_msg = f"Servidor SMTP desconectado: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except smtplib.SMTPException as e:
        error_msg = f"Error SMTP: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except TimeoutError as e:
        error_msg = f"Timeout conectando a SMTP: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except Exception as e:
        error_msg = f"Error desconocido: {str(e)}"
        logger.error(f"❌ {error_msg}", exc_info=True)
        return False, error_msg