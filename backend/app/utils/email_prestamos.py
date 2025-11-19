import logging
import os
import requests

logger = logging.getLogger(__name__)

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_NAME = os.getenv("SENDER_NAME")


async def send_prestamo_confirmacion(
    recipient_email: str,
    nombre_usuario: str,
    titulo_libro: str,
    fecha_recogida: str,
    fecha_devolucion: str
):
    """Envía correo de confirmación de préstamo"""
    
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

    return await _send_email_brevo(recipient_email, subject, html_content, nombre_usuario)


async def send_prestamo_cancelado(
    recipient_email: str,
    nombre_usuario: str,
    titulo_libro: str
):
    """Envía correo cuando un usuario cancela un préstamo"""
    
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
                
                <p style="margin-top: 30px;">¡Gracias por usar Aeternum!</p>
                
                <p style="font-size: 0.8em; color: #999; margin-top: 30px;">
                    Este es un correo automático. Por favor, no respondas a este mensaje.
                </p>
            </div>
        </body>
    </html>
    """

    return await _send_email_brevo(recipient_email, subject, html_content, nombre_usuario)


async def send_recordatorio_devolucion(
    recipient_email: str,
    nombre_usuario: str,
    titulo_libro: str,
    fecha_devolucion: str,
    dias_restantes: int
):
    """Envía recordatorio de devolución próxima"""
    
    subject = "⏰ Recordatorio de Devolución - Aeternum"
    
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

    return await _send_email_brevo(recipient_email, subject, html_content, nombre_usuario)


async def send_prestamo_atrasado(
    recipient_email: str,
    nombre_usuario: str,
    titulo_libro: str,
    fecha_devolucion: str
):
    """Envía correo cuando un préstamo pasa a estado atrasado"""
    
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

    return await _send_email_brevo(recipient_email, subject, html_content, nombre_usuario)


async def send_prestamo_cancelado_bibliotecario(
    recipient_email: str,
    nombre_usuario: str,
    titulo_libro: str,
    motivo: str = None
):
    """Envía correo cuando un BIBLIOTECARIO cancela un préstamo"""
    
    subject = "⚠️ Préstamo Cancelado por Biblioteca - Aeternum"
    
    motivo_html = ""
    if motivo:
        motivo_html = f"""
        <div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>Motivo:</strong> {motivo}</p>
        </div>
        """
    
    html_content = f"""
    <html>
        <body>
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #d9534f;">⚠️ Préstamo Cancelado</h2>
                
                <p>Hola <strong>{nombre_usuario}</strong>,</p>
                
                <p>Te informamos que tu préstamo físico ha sido <strong>cancelado por la librería</strong>.</p>
                
                <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d9534f;">
                    <h3 style="margin-top: 0; color: #721c24;">Libro Cancelado:</h3>
                    <p><strong>{titulo_libro}</strong></p>
                </div>
                
                {motivo_html}

                <p>El libro fue cancelado por no venir en la fecha que se seleccionó, por este motivo se canceló su préstamo.</p>
                
                <p>El libro ha sido liberado y ya está disponible para otros usuarios.</p>
                
                <p>Si tienes alguna pregunta o necesitas más información, por favor contacta con la biblioteca.</p>
                
                <p style="margin-top: 30px;">Gracias por usar Aeternum</p>
                
                <p style="font-size: 0.8em; color: #999; margin-top: 30px;">
                    Este es un correo automático. Por favor, no respondas a este mensaje.
                </p>
            </div>
        </body>
    </html>
    """

    return await _send_email_brevo(recipient_email, subject, html_content, nombre_usuario)


# 🔥 Función auxiliar para enviar emails con Brevo
async def _send_email_brevo(recipient_email: str, subject: str, html_content: str, user_name: str = None):
    """Envía email usando la API de Brevo"""
    
    logger.info(f"📧 Enviando email a: {recipient_email}")
    
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
        return False, "BREVO_API_KEY no configurada"
    
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
            logger.info(f"✅ Email enviado exitosamente. ID: {message_id}")
            return True, "Correo enviado exitosamente"
        else:
            error_msg = f"Error {response.status_code}: {response.text}"
            logger.error(f"❌ {error_msg}")
            return False, error_msg
    
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return False, error_msg