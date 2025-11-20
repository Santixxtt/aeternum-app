from fastapi import APIRouter, HTTPException
from app.models import user_model
from app.utils.email_sender import send_verification_email
from datetime import datetime, timedelta
import secrets
from app.dependencias.redis import r

router = APIRouter(prefix="/auth", tags=["Auth"])

# ✅ Endpoint para enviar correo de verificación
@router.post("/send-verification")
async def send_verification(email: str):
    """
    Reenvía el correo de verificación a un usuario pendiente.
    """
    user = await user_model.get_user_by_email(email)
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    # Solo permitir reenvío si está en estado Pendiente
    if user.get("estado") != "Pendiente":
        raise HTTPException(
            status_code=400, 
            detail="Esta cuenta ya está verificada o no requiere verificación."
        )
    
    # Generar token único de verificación
    token = secrets.token_urlsafe(32)
    
    # Guardar token en Redis con expiración de 24 horas
    user_id = user["id"]
    token_key = f"email_verification:{user_id}"
    r.setex(token_key, 24 * 60 * 60, token)  # 24 horas
    
    # Construir URL de verificación
    frontend_url = "https://aeternum-app-production.up.railway.app"
    verification_url = f"{frontend_url}/verify-email?token={token}&user_id={user_id}"
    
    # Enviar correo
    user_name = f"{user['nombre']} {user['apellido']}"
    success, message = send_verification_email(
        recipient_email=email,
        verification_url=verification_url,
        user_name=user_name
    )
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Error al enviar correo: {message}")
    
    return {
        "message": "Correo de verificación enviado. Por favor revisa tu bandeja de entrada."
    }


# ✅ Endpoint para verificar el email con el token
@router.get("/verify-email")
async def verify_email(token: str, user_id: int):
    """
    Verifica el correo electrónico del usuario usando el token.
    """
    # Obtener el token almacenado en Redis
    token_key = f"email_verification:{user_id}"
    stored_token = r.get(token_key)
    
    if not stored_token:
        raise HTTPException(
            status_code=400, 
            detail="El token de verificación ha expirado o no existe. Solicita un nuevo correo."
        )
    
    # Verificar que el token coincida
    if stored_token.decode() != token:
        raise HTTPException(status_code=400, detail="Token de verificación inválido.")
    
    # Verificar que el usuario exista
    user = await user_model.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    # Verificar que esté en estado Pendiente
    if user.get("estado") != "Pendiente":
        raise HTTPException(
            status_code=400, 
            detail="Esta cuenta ya está verificada o no puede ser activada."
        )
    
    # ✅ Activar la cuenta
    await user_model.update_user_status(user_id, "Activo")
    
    # Eliminar el token de Redis
    r.delete(token_key)
    
    return {
        "message": "¡Correo verificado con éxito! Ya puedes iniciar sesión.",
        "verified": True
    }