import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from concurrent.futures import ThreadPoolExecutor

SENDER_EMAIL = "aeternum538@gmail.com"
SENDER_PASSWORD = "wuby uikp lilt rfkq"

# Pool de threads para operaciones de envío de correo
email_pool = ThreadPoolExecutor(max_workers=3)


async def send_prestamo_confirmacion(
    recipient_email: str,
    nombre_usuario: str,
    titulo_libro: str,
    fecha_recogida: str,
    fecha_devolucion: str
):
   
    subject = "Préstamo Confirmado - Aeternum"
    
    html_content = f"""
    <html>
        <body>
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #B6407D;">Préstamo Físico Confirmado</h2>
                
                <p>Hola <strong>{nombre_usuario}</strong>,</p>
                
                <p>Tu solicitud de préstamo físico ha sido confirmada exitosamente.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Detalles del Préstamo:</h3>
                    <p><strong>Libro:</strong> {titulo_libro}</p>
                    <p><strong>Fecha de recogida:</strong> {fecha_recogida}</p>
                    <p><strong>Fecha de devolución:</strong> {fecha_devolucion}</p>
                    <p style="color: #B6407D; font-weight: bold;">Tienes 12 días para disfrutar de este libro.</p>
                </div>
                
                <p>Por favor, recoge el libro en la biblioteca en la fecha indicada.</p>
                
                <p style="font-size: 0.9em; color: #666;">
                    <strong>Importante:</strong> Recuerda devolver el libro antes de la fecha límite para evitar sanciones.
                </p>
                
                <p style="margin-top: 30px;">¡Disfruta tu lectura!</p>
                
                <p style="font-size: 0.8em; color: #999; margin-top: 30px;">
                    Este es un correo automático. Por favor, no respondas a este mensaje.
                </p>
            </div>
        </body>
    </html>
    """

    return await _send_email_async(recipient_email, subject, html_content)


async def send_prestamo_cancelado(
    recipient_email: str,
    nombre_usuario: str,
    titulo_libro: str
):
    """
    Envía correo cuando un usuario cancela un préstamo.
    """
    subject = "Préstamo Cancelado - Aeternum"
    
    html_content = f"""
    <html>
        <body>
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #666;">Préstamo Cancelado</h2>
                
                <p>Hola <strong>{nombre_usuario}</strong>,</p>
                
                <p>Tu préstamo físico ha sido cancelado exitosamente.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Libro Cancelado:</h3>
                    <p><strong>{titulo_libro}</strong></p>
                </div>
                
                <p>El libro ha sido liberado y ya está disponible para otros usuarios.</p>
                
                <p>Si cambias de opinión, puedes solicitar el préstamo nuevamente desde nuestro catálogo.</p>
                
                <p style="margin-top: 30px;">¡Gracias por usar Aeternum! </p>
                
                <p style="font-size: 0.8em; color: #999; margin-top: 30px;">
                    Este es un correo automático. Por favor, no respondas a este mensaje.
                </p>
            </div>
        </body>
    </html>
    """

    return await _send_email_async(recipient_email, subject, html_content)


async def send_recordatorio_devolucion(
    recipient_email: str,
    nombre_usuario: str,
    titulo_libro: str,
    fecha_devolucion: str,
    dias_restantes: int
):
    """
    Envía recordatorio de devolución próxima.
    """
    subject = " Recordatorio de Devolución - Aeternum"
    
    html_content = f"""
    <html>
        <body>
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #B6407D;">⏰ Recordatorio de Devolución</h2>
                
                <p>Hola <strong>{nombre_usuario}</strong>,</p>
                
                <p>Este es un recordatorio amistoso sobre la devolución de tu libro.</p>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <h3 style="margin-top: 0; color: #856404;">Detalles del Préstamo:</h3>
                    <p><strong>Libro:</strong> {titulo_libro}</p>
                    <p><strong>Fecha de devolución:</strong> {fecha_devolucion}</p>
                    <p style="color: #d9534f; font-weight: bold; font-size: 1.1em;">
                        ⚠️ Te quedan {dias_restantes} día(s) para devolver este libro.
                    </p>
                </div>
                
                <p>Por favor, devuelve el libro a tiempo para evitar penalizaciones.</p>
                
                <p style="margin-top: 30px;">¡Gracias por usar Aeternum! 📚</p>
                
                <p style="font-size: 0.8em; color: #999; margin-top: 30px;">
                    Este es un correo automático. Por favor, no respondas a este mensaje.
                </p>
            </div>
        </body>
    </html>
    """

    return await _send_email_async(recipient_email, subject, html_content)


def _send_email_sync(recipient_email: str, subject: str, html_content: str):

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = SENDER_EMAIL
    message["To"] = recipient_email

    part = MIMEText(html_content, "html")
    message.attach(part)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
        
        print(f"✅ Correo enviado a {recipient_email}")
        return True, "Correo enviado exitosamente"
    except Exception as e:
        print(f"❌ Error al enviar correo: {e}")
        return False, str(e)


async def _send_email_async(recipient_email: str, subject: str, html_content: str):
    """
    Wrapper asíncrono que ejecuta el envío de correo en el pool de threads.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        email_pool,
        _send_email_sync,
        recipient_email,
        subject,
        html_content
    )

async def send_prestamo_atrasado(
    recipient_email: str,
    nombre_usuario: str,
    titulo_libro: str,
    fecha_devolucion: str
):
    """
    Envía correo cuando un préstamo pasa a estado atrasado.
    """
    subject = "⛔ Préstamo Atrasado - Aeternum"
    
    html_content = f"""
    <html>
        <body>
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #D9534F;">⚠️ Préstamo Atrasado</h2>

                <p>Hola <strong>{nombre_usuario}</strong>,</p>

                <p>El tiempo para devolver el libro ha expirado y tu préstamo ahora aparece como <strong>atrasado</strong>.</p>

                <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d9534f;">
                    <p><strong>Libro:</strong> {titulo_libro}</p>
                    <p><strong>Fecha límite:</strong> {fecha_devolucion}</p>
                </div>

                <p>Por favor devuelve el libro lo antes posible para evitar sanciones adicionales.</p>

                <p style="margin-top: 30px;">Gracias por usar Aeternum.</p>

                <p style="font-size: 0.8em; color: #999; margin-top: 30px;">
                    Este es un correo automático. No respondas a este mensaje.
                </p>
            </div>
        </body>
    </html>
    """

    return await _send_email_async(recipient_email, subject, html_content)