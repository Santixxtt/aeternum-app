from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.models import user_model, password_recovery_model
from app.utils.email_sender import send_password_recovery_email
from app.utils.security import hash_password
from typing import Annotated
from app.dependencias.redis import r
import secrets
import logging

# 🔥 CONFIGURA LOGGING
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/password", tags=["PasswordRecovery"])

FRONTEND_BASE_URL = "http://localhost:5173"
RESET_PATH = "/restablecer-contrasena"


# 🔥 WRAPPER PARA LOGUEAR ERRORES EN BACKGROUND
def send_email_with_logging(correo: str, recovery_url: str):
    """Envía email y loguea el resultado"""
    try:
        logger.info(f"🔵 Iniciando envío de email a: {correo}")
        success, message = send_password_recovery_email(correo, recovery_url)
        
        if success:
            logger.info(f"✅ Email enviado exitosamente a {correo}")
        else:
            logger.error(f"❌ Falló envío a {correo}: {message}")
            
    except Exception as e:
        logger.error(f"💥 Excepción al enviar email a {correo}: {str(e)}", exc_info=True)


@router.post("/recuperar_contrasena")
async def solicitar_recuperacion(
    correo: Annotated[str, Query()],
    background_tasks: BackgroundTasks
):
    logger.info(f"📨 Solicitud de recuperación para: {correo}")
    
    user = await user_model.get_user_by_email(correo)
    
    if not user:
        logger.warning(f"⚠️ Usuario no encontrado: {correo}")
        return {"message": "Si este correo está registrado, recibirás un enlace para restablecer tu contraseña."}
    
    token = secrets.token_hex(32)
    logger.info(f"🔑 Token generado: {token[:16]}...")
    
    await password_recovery_model.create_recovery_request(user["id"], token)
    logger.info(f"💾 Token guardado en BD para usuario {user['id']}")
    
    try:
        r.setex(f"pwdreset:{token}", 3600, user["id"])
        logger.info("✅ Token guardado en Redis")
    except Exception as e:
        logger.warning(f"⚠️ Redis no disponible: {e}")
    
    recovery_url = f"{FRONTEND_BASE_URL}{RESET_PATH}?token={token}"
    logger.info(f"🔗 URL de recuperación: {recovery_url}")
    
    # 🔥 USA EL WRAPPER CON LOGGING
    background_tasks.add_task(send_email_with_logging, correo, recovery_url)
    logger.info("📤 Tarea de email agregada a background")
    
    return {"message": "Si este correo está registrado, recibirás un enlace para restablecer tu contraseña."}


@router.post("/restablecer_contrasena")
async def restablecer_contrasena(
    token: Annotated[str, Query()],
    nueva_contrasena: Annotated[str, Query()]
):
    logger.info(f"🔄 Intento de restablecer contraseña con token: {token[:16]}...")
    
    # ✅ Intentar validar token desde Redis
    try:
        redis_user_id = r.get(f"pwdreset:{token}")
        if redis_user_id:
            user_id = int(redis_user_id)
            logger.info(f"✅ Token encontrado en Redis para usuario {user_id}")
        else:
            logger.info("⚠️ Token no encontrado en Redis, buscando en BD...")
            recovery = await password_recovery_model.get_recovery_request_by_token(token)
            if not recovery:
                logger.error("❌ Token no válido o expirado")
                raise HTTPException(status_code=400, detail="El enlace ha expirado o no es válido.")
            user_id = recovery["usuario_id"]
            logger.info(f"✅ Token encontrado en BD para usuario {user_id}")
    except Exception as e:
        logger.warning(f"⚠️ Error verificando Redis: {e}")
        recovery = await password_recovery_model.get_recovery_request_by_token(token)
        if not recovery:
            raise HTTPException(status_code=400, detail="El enlace ha expirado o no es válido.")
        user_id = recovery["usuario_id"]
    
    hashed_password = hash_password(nueva_contrasena)
    updated = await user_model.update_password(user_id, hashed_password)
    
    if not updated:
        logger.error(f"❌ Error actualizando contraseña para usuario {user_id}")
        raise HTTPException(status_code=500, detail="Error al actualizar la contraseña.")
    
    await password_recovery_model.mark_token_as_used(token)
    logger.info(f"✅ Token marcado como usado")
    
    try:
        r.delete(f"pwdreset:{token}")
        logger.info("✅ Token eliminado de Redis")
    except Exception:
        pass
    
    logger.info(f"🎉 Contraseña restablecida exitosamente para usuario {user_id}")
    return {"message": "Contraseña restablecida exitosamente"}