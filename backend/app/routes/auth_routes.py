from fastapi import APIRouter, HTTPException, Request
from app.models import user_model
from app.utils.security import verify_password, hash_password, create_access_token
from datetime import datetime
from app.schemas.user_schema import UserLogin, UserRegister
from app.dependencias.redis import r  

router = APIRouter(prefix="/auth", tags=["Auth"])

MAX_ATTEMPTS = 3
LOCK_TIME_SECONDS = 15 * 60  # 15 min

@router.post("/login")
async def login(user_data: UserLogin):
    user = await user_model.get_user_by_email(user_data.correo)
    if not user:
        raise HTTPException(status_code=401, detail="Correo o contraseña son incorrectos.")

    user_id = user["id"]
    attempts_key = f"login_attempts:{user_id}"
    lock_key = f"account_locked:{user_id}"

    # Verificar si la cuenta está bloqueada en Redis (intentos fallidos)
    if r.get(lock_key):
        raise HTTPException(status_code=403, detail="Cuenta bloqueada temporalmente. Intenta más tarde.")

    # Verificar contraseña ANTES de chequear estado
    attempts = int(r.get(attempts_key) or 0)

    if not verify_password(user_data.clave, user["clave"]):
        attempts += 1
        r.setex(attempts_key, LOCK_TIME_SECONDS, attempts)

        remaining = MAX_ATTEMPTS - attempts

        if attempts >= MAX_ATTEMPTS:
            r.setex(lock_key, LOCK_TIME_SECONDS, "1")
            raise HTTPException(status_code=403, detail="Cuenta bloqueada por intentos fallidos.")

        raise HTTPException(status_code=401, detail=f"Clave incorrecta. Intentos restantes: {remaining}")

    # AHORA SÍ verificar estado de la cuenta (DESPUÉS de validar contraseña)
    if user.get("estado") == "Bloqueado":
        motivo = user.get("motivo_bloqueo", "Cuenta bloqueada por el administrador")
        raise HTTPException(
            status_code=403, 
            detail=f"Tu cuenta está bloqueada. Motivo: {motivo}. Contacta a la biblioteca."
        )

    if user.get("estado") == "Desactivado":
        raise HTTPException(status_code=403, detail="Tu cuenta ha sido desactivada. Contacta al administrador.")

    # Login correcto, limpiar intentos
    r.delete(attempts_key)
    r.delete(lock_key)

    token = create_access_token({
        "sub": str(user_id),
        "correo": user["correo"],
        "rol": user["rol"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user["rol"]
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

    user_id = await user_model.create_user({
        "nombre": user.nombre,
        "apellido": user.apellido,
        "tipo_identificacion": user.tipo_identificacion,
        "num_identificacion": user.num_identificacion,
        "correo": user.correo,
        "clave": hashed,
        "rol": user.rol
    })

    # Guardar consentimiento
    consent_text = f"Acepto la Política de Privacidad de Aeternum (v1) - {datetime.now():%Y-%m-%d}"
    ip = request.client.host
    user_agent = request.headers.get("user-agent", "")[:255]
    await user_model.save_consent(user_id, consent_text, ip, user_agent)

    return {"message": "¡Cuenta creada con éxito!", "user_id": user_id}
