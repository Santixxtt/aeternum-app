from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel, EmailStr
from app.models import user_model
from app.utils.security import verify_password, hash_password, create_access_token
from datetime import datetime
from app.schemas.user_schema import UserLogin, UserRegister
from app.utils.email_welcome import send_verification_email
from app.dependencias.redis import r
import secrets
import os

router = APIRouter(prefix="/auth", tags=["Auth"])

MAX_ATTEMPTS = 3
LOCK_TIME_SECONDS = 15 * 60  # 15 min
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://aeternum-app-production.up.railway.app")


# Verificar conexión Redis al inicio
def test_redis_connection():
    try:
        r.ping()
        print("✅ Redis conectado correctamente")
        return True
    except Exception as e:
        print(f"❌ Redis NO está conectado: {e}")
        return False

# Ejecutar test
test_redis_connection()


# 📧 Request model para reenviar verificación
class ReenviarVerificacionRequest(BaseModel):
    correo: EmailStr

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

    # 4️⃣ Verificar estado ANTES de generar token
    estado = user.get("estado", "").strip()
    
    if estado == "Bloqueado":
        motivo = user.get("motivo_bloqueo", "Cuenta bloqueada por el administrador")
        raise HTTPException(
            status_code=403, 
            detail=f"Tu cuenta está bloqueada. Motivo: {motivo}. Contacta a la biblioteca para más información."
        )

    if estado == "Desactivado":
        raise HTTPException(
            status_code=403, 
            detail="Tu cuenta ha sido desactivada por un administrador. Contacta con la biblioteca para reactivarla."
        )
    
    if estado == "Pendiente":
        raise HTTPException(
            status_code=403,
            detail="Tu cuenta no ha sido verificada. Por favor revisa tu correo y verifica tu cuenta."
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
        "estado": "Pendiente"
    })

    # Guardar consentimiento
    consent_text = f"Acepto la Política de Privacidad de Aeternum (v1) - {datetime.now():%Y-%m-%d}"
    ip = request.client.host
    user_agent = request.headers.get("user-agent", "")[:255]
    await user_model.save_consent(user_id, consent_text, ip, user_agent)

    # Generar token
    token = secrets.token_urlsafe(32)
    token_key = f"email_verification:{user_id}"
    r.setex(token_key, 24 * 60 * 60, token)

    verification_url = f"{FRONTEND_URL}/verificar-email?token={token}&user_id={user_id}"

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


@router.get("/verificar-email")
async def verify_email(token: str, user_id: int):
    """Verifica el correo electrónico del usuario usando el token"""
    
    print(f"🔍 DEBUG - User ID: {user_id}")
    print(f"🔍 DEBUG - Token recibido: {token}")
    
    token_key = f"email_verification:{user_id}"
    
    try:
        stored_token = r.get(token_key)
        print(f"🔍 DEBUG - Token almacenado (raw): {stored_token}")
        print(f"🔍 DEBUG - Tipo del token almacenado: {type(stored_token)}")
    except Exception as e:
        print(f"❌ Error al obtener token de Redis: {e}")
        raise HTTPException(
            status_code=503,
            detail="Error del servidor. Por favor intenta más tarde."
        )

    if not stored_token:
        print("❌ Token no encontrado en Redis")
        raise HTTPException(
            status_code=400,
            detail="El enlace ha expirado o ya fue utilizado."
        )

    # Manejar tanto bytes como string
    if isinstance(stored_token, bytes):
        stored_token = stored_token.decode("utf-8")
    
    print(f"🔍 DEBUG - Token almacenado (procesado): {stored_token}")
    print(f"🔍 DEBUG - ¿Tokens coinciden?: {token == stored_token}")

    if token != stored_token:
        print(f"❌ Tokens NO coinciden!")
        print(f"   Recibido: '{token}'")
        print(f"   Esperado: '{stored_token}'")
        raise HTTPException(
            status_code=400,
            detail="Token inválido. Solicita un nuevo enlace."
        )

    # Activar usuario
    print(f"✅ Token válido, activando usuario {user_id}")
    updated = await user_model.update_user_status(user_id, "Activo")

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar el estado del usuario."
        )

    # Eliminar token
    r.delete(token_key)
    print(f"✅ Usuario {user_id} verificado exitosamente")

    return {"message": "Correo verificado exitosamente. Ya puedes iniciar sesión."}

@router.post("/reenviar-verificacion")
async def reenviar_verificacion(
    request: ReenviarVerificacionRequest,
    background_tasks: BackgroundTasks
):
    """
    Reenvía el correo de verificación a un usuario.
    Por seguridad, siempre devuelve el mismo mensaje.
    """
    correo = request.correo.lower()
    
    # Buscar usuario
    user = await user_model.get_user_by_email(correo)
    
    # Mensaje genérico por seguridad
    response_message = "Si el correo está registrado y no verificado, recibirás un nuevo enlace de verificación."
    
    if not user:
        return {"message": response_message}
    
    # Si ya está verificado/activo
    if user.get("estado") != "Pendiente":
        return {"message": "Este correo ya está verificado. Puedes iniciar sesión."}
    
    # Generar nuevo token
    token = secrets.token_urlsafe(32)
    user_id = user["id"]
    
    print(f"🔑 Generando token para user_id={user_id}")
    print(f"🔑 Token generado: {token}")
    
    # Guardar en Redis (24 horas)
    token_key = f"email_verification:{user_id}"
    
    try:
        # Verificar si Redis está disponible
        if not test_redis_connection():
            raise Exception("Redis no disponible")
        
        # Guardar token
        result = r.setex(token_key, 24 * 60 * 60, token)
        print(f"💾 Resultado de setex: {result}")
        
        # Verificar que se guardó correctamente
        stored = r.get(token_key)
        print(f"✅ Token guardado y verificado en Redis: {stored}")
        
        if not stored:
            raise Exception("Token no se guardó correctamente")
            
    except Exception as e:
        print(f"❌ Error crítico con Redis: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Error al generar token de verificación. Por favor intenta más tarde."
        )
    
    # Construir URL
    verification_url = f"{FRONTEND_URL}/verificar-email?token={token}&user_id={user_id}"
    print(f"🔗 URL de verificación: {verification_url}")
    
    # Obtener nombre
    nombre = user.get("nombre", "")
    apellido = user.get("apellido", "")
    
    if nombre and apellido:
        user_name = f"{nombre} {apellido}"
    elif nombre:
        user_name = nombre
    else:
        user_name = correo.split("@")[0].capitalize()
    
    # Enviar email en background
    background_tasks.add_task(
        send_verification_email,
        correo,
        verification_url,
        user_name
    )
    
    print(f"📧 Email de verificación programado para: {correo}")
    
    return {"message": response_message}


@router.get("/verificar-email")
async def verify_email(token: str, user_id: int):
    """Verifica el correo electrónico del usuario usando el token"""
    
    print(f"🔍 DEBUG - User ID: {user_id}")
    print(f"🔍 DEBUG - Token recibido: {token}")
    
    # Verificar conexión Redis
    if not test_redis_connection():
        raise HTTPException(
            status_code=503,
            detail="Servicio temporalmente no disponible. Por favor intenta más tarde."
        )
    
    token_key = f"email_verification:{user_id}"
    print(f"🔍 DEBUG - Buscando key: {token_key}")
    
    try:
        stored_token = r.get(token_key)
        print(f"🔍 DEBUG - Token almacenado (raw): {stored_token}")
        print(f"🔍 DEBUG - Tipo del token almacenado: {type(stored_token)}")
        
        # Listar todas las keys para debug
        all_keys = r.keys("email_verification:*")
        print(f"🔍 DEBUG - Todas las keys de verificación: {all_keys}")
        
    except Exception as e:
        print(f"❌ Error al obtener token de Redis: {e}")
        raise HTTPException(
            status_code=503,
            detail="Error del servidor. Por favor intenta más tarde."
        )

    if not stored_token:
        print("❌ Token no encontrado en Redis")
        raise HTTPException(
            status_code=400,
            detail="El enlace ha expirado o ya fue utilizado. Por favor solicita un nuevo enlace."
        )

    # Manejar tanto bytes como string
    if isinstance(stored_token, bytes):
        stored_token = stored_token.decode("utf-8")
    
    print(f"🔍 DEBUG - Token almacenado (procesado): {stored_token}")
    print(f"🔍 DEBUG - ¿Tokens coinciden?: {token == stored_token}")

    if token != stored_token:
        print(f"❌ Tokens NO coinciden!")
        print(f"   Recibido: '{token}'")
        print(f"   Esperado: '{stored_token}'")
        raise HTTPException(
            status_code=400,
            detail="Token inválido. Solicita un nuevo enlace."
        )

    # Activar usuario
    print(f"✅ Token válido, activando usuario {user_id}")
    updated = await user_model.update_user_status(user_id, "Activo")

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar el estado del usuario."
        )

    # Eliminar token
    r.delete(token_key)
    print(f"✅ Usuario {user_id} verificado exitosamente")

    return {"message": "Correo verificado exitosamente. Ya puedes iniciar sesión."}


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
        "estado": "Pendiente"
    })

    # Guardar consentimiento
    consent_text = f"Acepto la Política de Privacidad de Aeternum (v1) - {datetime.now():%Y-%m-%d}"
    ip = request.client.host
    user_agent = request.headers.get("user-agent", "")[:255]
    await user_model.save_consent(user_id, consent_text, ip, user_agent)

    # Generar token
    token = secrets.token_urlsafe(32)
    token_key = f"email_verification:{user_id}"
    
    print(f"🔑 [REGISTER] Generando token para user_id={user_id}")
    print(f"🔑 [REGISTER] Token: {token}")
    
    try:
        if not test_redis_connection():
            raise Exception("Redis no disponible")
            
        result = r.setex(token_key, 24 * 60 * 60, token)
        print(f"💾 [REGISTER] Resultado setex: {result}")
        
        # Verificar
        stored = r.get(token_key)
        print(f"✅ [REGISTER] Token verificado en Redis: {stored}")
        
        if not stored:
            raise Exception("Token no se guardó")
            
    except Exception as e:
        print(f"❌ [REGISTER] Error con Redis: {e}")
        await user_model.delete_user(user_id)
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar token de verificación: {str(e)}"
        )

    verification_url = f"{FRONTEND_URL}/verificar-email?token={token}&user_id={user_id}"

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