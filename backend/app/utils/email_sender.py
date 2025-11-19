import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import os

logger = logging.getLogger(__name__)

# 🔥 Configuración segura: sin valores por defecto
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SMTP_LOGIN = os.getenv("SMTP_LOGIN")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


def send_password_recovery_email(recipient_email: str, recovery_url: str):
    """
    Envía un correo electrónico con el enlace de recuperación usando Brevo SMTP relay.
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
                <h2 style="color: #007bff; margin: 0;">🔐 Aeternum</h2>
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
                <strong>⏱️ Este enlace expirará en 1 hora</strong> por razones de seguridad.
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
    
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"Aeternum <{SENDER_EMAIL}>"
    message["To"] = recipient_email
    message["Reply-To"] = SENDER_EMAIL
    
    part = MIMEText(html_content, "html", "utf-8")
    message.attach(part)
    
    try:
        logger.info("🔌 Conectando a servidor SMTP Brevo...")
        
        # Usar STARTTLS en puerto 587 (más compatible que SSL 465)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            logger.info("✅ Conectado a SMTP")
            
            # Iniciar conexión segura
            server.starttls()
            logger.info("🔐 TLS iniciado")
            
            # Autenticar
            logger.info(f"🔑 Autenticando con: {SMTP_LOGIN}")
            server.login(SMTP_LOGIN, SMTP_PASSWORD)
            logger.info("✅ Autenticación exitosa")
            
            # Enviar
            logger.info("📤 Enviando email...")
            server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
            logger.info("✅ Email enviado exitosamente")
        
        return True, "Correo enviado exitosamente"
    
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"Error de autenticación: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except smtplib.SMTPException as e:
        error_msg = f"Error SMTP: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except TimeoutError as e:
        error_msg = f"Timeout: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    except Exception as e:
        error_msg = f"Error desconocido: {str(e)}"
        logger.error(f"❌ {error_msg}", exc_info=True)
        return False, error_msg