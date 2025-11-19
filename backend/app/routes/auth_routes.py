from fastapi import APIRouter, HTTPException, Request
from app.models import user_model
from app.utils.security import verify_password, hash_password, create_access_token
from datetime import datetime
from app.schemas.user_schema import UserLogin, UserRegister
from app.utils.email_welcome import send_verification_email
from app.dependencias.redis import r
import secrets

router = APIRouter(prefix="/auth", tags=["Auth"])

MAX_ATTEMPTS = 3
LOCK_TIME_SECONDS = 15 * 60  # 15 min

@router.post("/login")
async def login(user_data: UserLogin):
    # 1️⃣ Verificar si el usuario existe
    user = await user_model.get_user_by_email(user_data.correo)
    if not user:
        raise HTTPException(status_code=401, detail="Correo o contraseña son incorrectos.")

    user_id = user["id"]
    attempts_key = f"login_attempts:{user_id}"
    lock_key = f"account_locked:{user_id}"

    # 2️⃣ Verificar si la cuenta está bloqueada temporalmente (intentos fallidos)
    if r.get(lock_key):
        raise HTTPException(
            status_code=403, 
            detail="Cuenta bloqueada temporalmente por intentos fallidos. Intenta en 15 minutos."
        )

    # 3️⃣ Verificar contraseña
    attempts = int(r.get(attempts_key) or 0)

    if not verify_password(user_data.clave, user["clave"]):
        attempts += 1
        r.setex(attempts_key, LOCK_TIME_SECONDS, attempts)

        remaining = MAX_ATTEMPTS - attempts

        if attempts >= MAX_ATTEMPTS:
            r.setex(lock_key, LOCK_TIME_SECONDS, "1")
            raise HTTPException(
                status_code=403, 
                detail="Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta en 15 minutos."
            )

        raise HTTPException(
            status_code=401, 
            detail=f"Contraseña incorrecta. Intentos restantes: {remaining}"
        )

    # 4️⃣ ✅ NUEVO: Verificar estado ANTES de generar token
    estado = user.get("estado", "").strip()
    
    if estado == "Bloqueado":
        motivo = user.get("motivo_bloqueo", "Cuenta bloqueada por el administrador")
        # ⚠️ NO limpiar intentos aquí - la cuenta está bloqueada permanentemente
        raise HTTPException(
            status_code=403, 
            detail=f"Tu cuenta está bloqueada. Motivo: {motivo}. Contacta a la biblioteca para más información."
        )

    if estado == "Desactivado":
        # ⚠️ NO limpiar intentos - la cuenta fue desactivada por admin
        raise HTTPException(
            status_code=403, 
            detail="Tu cuenta ha sido desactivada por un administrador. Contacta con la biblioteca para reactivarla."
        )
    
    if estado != "Activo":
        raise HTTPException(
            status_code=403,
            detail=f"Tu cuenta está en estado '{estado}'. Contacta al administrador."
        )

    # 5️⃣ Login exitoso - Limpiar intentos fallidos
    r.delete(attempts_key)
    r.delete(lock_key)

    # 6️⃣ Verificar si la sesión fue invalidada manualmente por admin
    session_invalid_key = f"user_session_invalid:{user_id}"
    if r.get(session_invalid_key):
        # Limpiar la marca porque el usuario está haciendo login nuevamente
        r.delete(session_invalid_key)
        print(f"🔓 Sesión invalidada limpiada para usuario {user_id} (nuevo login)")

    # 7️⃣ Generar token
    token = create_access_token({
        "sub": str(user_id),
        "correo": user["correo"],
        "rol": user["rol"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user["rol"],
        "usuario": {
            "id": user_id,
            "nombre": user["nombre"],
            "apellido": user["apellido"],
            "correo": user["correo"]
        }
    }


# 🔹 REGISTER
@router.post("/register")
async def register_user(user: UserRegister, request: Request):
    if not user.consent:
        raise HTTPException(status_code=400, detail="Debes aceptar la Política de Privacidad.")

    # Verificar duplicados
    if await user_model.email_exists(user.correo):
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")
    if await user_model.id_exists(user.num_identificacion):
        raise HTTPException(status_code=400, detail="El número de identificación ya está registrado.")

    hashed = hash_password(user.clave)

    # Crear usuario en estado "Pendiente"
    user_id = await user_model.create_user({
        "nombre": user.nombre,
        "apellido": user.apellido,
        "tipo_identificacion": user.tipo_identificacion,
        "num_identificacion": user.num_identificacion,
        "correo": user.correo,
        "clave": hashed,
        "rol": user.rol,
        "estado": "Pendiente"  # Usuario no activo hasta verificar email
    })

    # Guardar consentimiento
    consent_text = f"Acepto la Política de Privacidad de Aeternum (v1) - {datetime.now():%Y-%m-%d}"
    ip = request.client.host
    user_agent = request.headers.get("user-agent", "")[:255]
    await user_model.save_consent(user_id, consent_text, ip, user_agent)

    token = secrets.token_urlsafe(32)
    token_key = f"email_verification:{user_id}"
    r.setex(token_key, 24 * 60 * 60, token)  # Expira en 24 horas

    frontend_url = "http://localhost:5173"  # 🔹 Cambiar según tu dominio de producción
    verification_url = f"{frontend_url}/verificar-email?token={token}&user_id={user_id}"

    user_name = f"{user.nombre} {user.apellido}"
    success, message = send_verification_email(
        recipient_email=user.correo,
        verification_url=verification_url,
        user_name=user_name
    )

    if not success:
        await user_model.delete_user(user_id)
        raise HTTPException(
            status_code=500, 
            detail=f"Error al enviar correo de verificación: {message}"
        )

    return {
        "message": "¡Cuenta creada! Por favor verifica tu correo electrónico para activar tu cuenta.",
        "user_id": user_id,
        "email_sent": True
    }

@router.get("/verify-email")
async def verify_email(token: str, user_id: int):
    token_key = f"email_verification:{user_id}"
    stored_token = r.get(token_key)

    if not stored_token:
        raise HTTPException(
            status_code=400,
            detail="El enlace ha expirado o ya fue utilizado."
        )

    stored_token = stored_token.decode("utf-8")

    if token != stored_token:
        raise HTTPException(
            status_code=400,
            detail="Token inválido. Solicita un nuevo enlace."
        )

    # Activar usuario usando la función correcta
    updated = await user_model.update_user_status(user_id, "Activo")

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar el estado del usuario."
        )

    # Eliminar token para que no pueda reutilizarse
    r.delete(token_key)

    return {"message": "Correo verificado exitosamente. Ya puedes iniciar sesión."}
