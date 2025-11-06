from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.models import user_model, password_recovery_model
from app.utils.email_sender import send_password_recovery_email
from app.utils.security import hash_password
from typing import Annotated
from app.dependencias.redis import r   
import secrets

router = APIRouter(prefix="/password", tags=["PasswordRecovery"])

FRONTEND_BASE_URL = "http://localhost:5173"
RESET_PATH = "/restablecer-contrasena"


@router.post("/recuperar_contrasena")
async def solicitar_recuperacion(
    correo: Annotated[str, Query()],
    background_tasks: BackgroundTasks
):
    user = await user_model.get_user_by_email(correo)

    # Siempre devolvemos lo mismo por seguridad
    if not user:
        return {"message": "Si este correo está registrado, recibirás un enlace para restablecer tu contraseña."}

    token = secrets.token_hex(32)

    await password_recovery_model.create_recovery_request(user["id"], token)

    try:
        r.setex(f"pwdreset:{token}", 3600, user["id"])
    except Exception as e:
        print(f"⚠️ Redis no disponible (password reset): {e}")

    recovery_url = f"{FRONTEND_BASE_URL}{RESET_PATH}?token={token}"

    background_tasks.add_task(send_password_recovery_email, correo, recovery_url)

    return {"message": "Si este correo está registrado, recibirás un enlace para restablecer tu contraseña."}


@router.post("/restablecer_contrasena")
async def restablecer_contrasena(
    token: Annotated[str, Query()],
    nueva_contrasena: Annotated[str, Query()]
):
    # ✅ Intentar validar token desde Redis
    try:
        redis_user_id = r.get(f"pwdreset:{token}")
        if redis_user_id:
            user_id = int(redis_user_id)
        else:
            # Si no está en Redis -> buscar en BD
            recovery = await password_recovery_model.get_recovery_request_by_token(token)
            if not recovery:
                raise HTTPException(status_code=400, detail="El enlace ha expirado o no es válido.")
            user_id = recovery["usuario_id"]
    except Exception:
        # Si Redis falla, seguimos normal
        recovery = await password_recovery_model.get_recovery_request_by_token(token)
        if not recovery:
            raise HTTPException(status_code=400, detail="El enlace ha expirado o no es válido.")
        user_id = recovery["usuario_id"]

    hashed_password = hash_password(nueva_contrasena)

    updated = await user_model.update_password(user_id, hashed_password)
    if not updated:
        raise HTTPException(status_code=500, detail="Error al actualizar la contraseña.")

    await password_recovery_model.mark_token_as_used(token)

    try:
        r.delete(f"pwdreset:{token}")
    except Exception:
        pass

    return {"message": "Contraseña restablecida exitosamente"}
