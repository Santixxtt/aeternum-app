import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

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
    
    subject = "Cuenta bloqueada - Préstamos vencidos - Biblioteca Aeternum"
    
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
                <h1>Cuenta Bloqueada Temporalmente</h1>
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
                    <li>Una vez devueltos, el bibliotecario activara tu cuenta al instante</li>
                </ol>
                
                <p style="margin-top: 30px;">
                    <strong>Información de contacto:</strong><br>
                    Email: aeternum538@gmail.com<br>
                    Teléfono: (601) 123-4567<br>
                </p>
                
                <div style="text-align: center;">
                    <a href="http://localhost:5173/loyout_user/mis-prestamos" class="button">
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
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = recipient_email
        
        html_part = MIMEText(html_body, "html")
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Correo de bloqueo enviado a {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error enviando correo de bloqueo: {e}")
        return False