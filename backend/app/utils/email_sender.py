import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SENDER_EMAIL = "aeternum538@gmail.com"
SENDER_PASSWORD = "wuby uikp lilt rfkq" 

def send_password_recovery_email(recipient_email: str, recovery_url: str):
    """
    Envía un correo electrónico con el enlace de recuperación de contraseña.
    """
    
    subject = "Restablece tu contraseña de Aeternum"
    
    html_content = f"""
    <html>
        <body>
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #B6407D;">Solicitud de Restablecimiento de Contraseña</h2>
                <p>Recibimos una solicitud para restablecer la contraseña asociada a este correo.</p>
                
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

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = SENDER_EMAIL
    message["To"] = recipient_email

    # Adjuntar el contenido HTML
    part = MIMEText(html_content, "html")
    message.attach(part)

    try:
        # Conexión al servidor SMTP de Gmail
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
        
        return True, "Correo enviado exitosamente"
    except Exception as e:
        print(f"Error al enviar correo: {e}")
        return False, str(e)

# Ejemplo de uso (para pruebas):
# success, msg = send_password_recovery_email("ejemplo@destino.com", "http://localhost:3000/reset?token=123")
# print(msg)
