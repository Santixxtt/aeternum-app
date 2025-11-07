from fastapi import APIRouter, HTTPException, Request
from app.models import user_model
from app.utils.security import verify_password, hash_password, create_access_token
from datetime import datetime
from app.schemas.user_schema import UserLogin, UserRegister
from app.dependencias.redis import r
import logging
import traceback

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3
LOCK_TIME_SECONDS = 15 * 60  # 15 min

def safe_redis_get(key: str, default=None):
    """Obtiene valor de Redis con manejo de errores"""
    try:
        value = r.get(key)
        return value if value is not None else default
    except Exception as e:
        logger.warning(f"Redis error (get): {str(e)}")
        return default

def safe_redis_setex(key: str, time: int, value):
    """Guarda en Redis con manejo de errores"""
    try:
        r.setex(key, time, value)
        return True
    except Exception as e:
        logger.warning(f"Redis error (setex): {str(e)}")
        return False

def safe_redis_delete(key: str):
    """Elimina de Redis con manejo de errores"""
    try:
        r.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Redis error (delete): {str(e)}")
        return False

@router.post("/login")
async def login(user_data: UserLogin):
    logger.info(f"🔐 Intento de login para: {user_data.correo}")
    
    try:
        # 1. Buscar usuario
        logger.info("🔍 Buscando usuario en base de datos...")
        user = await user_model.get_user_by_email(user_data.correo)
        
        if not user:
            logger.warning(f"❌ Usuario no encontrado: {user_data.correo}")
            raise HTTPException(
                status_code=401, 
                detail="Correo o contraseña son incorrectos."
            )
        
        logger.info(f"✅ Usuario encontrado - ID: {user.get('id')}, Rol: {user.get('rol')}")
        
        # 2. Verificar estado
        if user.get("estado") == "Desactivado":
            logger.warning(f"❌ Usuario desactivado: {user_data.correo}")
            raise HTTPException(
                status_code=403, 
                detail="Esta cuenta ha sido desactivada."
            )

        user_id = user["id"]
        attempts_key = f"login_attempts:{user_id}"
        lock_key = f"account_locked:{user_id}"

        # 3. Verificar bloqueo en Redis
        logger.info("🔍 Verificando estado de bloqueo...")
        is_locked = safe_redis_get(lock_key)
        if is_locked:
            logger.warning(f"🔒 Cuenta bloqueada: {user_data.correo}")
            raise HTTPException(
                status_code=403, 
                detail="Cuenta bloqueada temporalmente. Intenta más tarde."
            )

        # 4. Obtener intentos fallidos
        attempts = int(safe_redis_get(attempts_key, 0) or 0)
        logger.info(f"📊 Intentos fallidos previos: {attempts}")

        # 5. Verificar contraseña
        logger.info("🔑 Verificando contraseña...")
        
        # Verificar que el hash existe
        if not user.get("clave"):
            logger.error(f"❌ No hay hash de contraseña para usuario: {user_data.correo}")
            raise HTTPException(
                status_code=500,
                detail="Error de configuración de cuenta."
            )
        
        password_valid = verify_password(user_data.clave, user["clave"])
        logger.info(f"🔐 Resultado verificación: {'✅ Válida' if password_valid else '❌ Inválida'}")
        
        if not password_valid:
            attempts += 1
            safe_redis_setex(attempts_key, LOCK_TIME_SECONDS, attempts)
            remaining = MAX_ATTEMPTS - attempts

            if attempts >= MAX_ATTEMPTS:
                safe_redis_setex(lock_key, LOCK_TIME_SECONDS, "1")
                logger.warning(f"🔒 Cuenta bloqueada por intentos: {user_data.correo}")
                raise HTTPException(
                    status_code=403, 
                    detail="Cuenta bloqueada por intentos fallidos."
                )

            logger.warning(f"❌ Contraseña incorrecta - Intentos restantes: {remaining}")
            raise HTTPException(
                status_code=401, 
                detail=f"Clave incorrecta. Intentos restantes: {remaining}"
            )

        # 6. Login exitoso - limpiar intentos
        logger.info("✅ Contraseña correcta - limpiando intentos...")
        safe_redis_delete(attempts_key)
        safe_redis_delete(lock_key)

        # 7. Generar token
        logger.info("🎫 Generando token de acceso...")
        token_data = {
            "sub": str(user_id),
            "correo": user["correo"],
            "rol": user["rol"]
        }
        token = create_access_token(token_data)
        
        logger.info(f"✅ Token generado exitosamente")

        # 8. Preparar respuesta
        response_data = {
            "access_token": token,
            "token_type": "bearer",
            "rol": user["rol"],
            "user": {
                "id": user["id"],
                "nombre": user.get("nombre", ""),
                "apellido": user.get("apellido", ""),
                "correo": user["correo"]
            }
        }
        
        logger.info(f"✅ Login exitoso para: {user_data.correo}")
        return response_data

    except HTTPException:
        # Re-lanzar errores HTTP conocidos
        raise
    except Exception as e:
        # Capturar cualquier otro error
        logger.error(f"❌ ERROR CRÍTICO en login: {str(e)}")
        logger.error(f"Traceback completo:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )


@router.post("/register")
async def register_user(user: UserRegister, request: Request):
    logger.info(f"📝 Intento de registro para: {user.correo}")
    
    try:
        # Verificar consentimiento
        if not user.consent:
            raise HTTPException(
                status_code=400, 
                detail="Debes aceptar la Política de Privacidad."
            )

        # Verificar duplicados
        logger.info("🔍 Verificando duplicados...")
        if await user_model.email_exists(user.correo):
            logger.warning(f"❌ Correo ya registrado: {user.correo}")
            raise HTTPException(
                status_code=400, 
                detail="El correo ya está registrado."
            )
        
        if await user_model.id_exists(user.num_identificacion):
            logger.warning(f"❌ Identificación ya registrada: {user.num_identificacion}")
            raise HTTPException(
                status_code=400, 
                detail="El número de identificación ya está registrado."
            )

        # Hash de contraseña
        logger.info("🔐 Hasheando contraseña...")
        hashed = hash_password(user.clave)

        # Crear usuario
        logger.info("💾 Creando usuario en base de datos...")
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
        logger.info("📄 Guardando consentimiento...")
        consent_text = f"Acepto la Política de Privacidad de Aeternum (v1) - {datetime.now():%Y-%m-%d}"
        ip = request.client.host
        user_agent = request.headers.get("user-agent", "")[:255]
        await user_model.save_consent(user_id, consent_text, ip, user_agent)

        logger.info(f"✅ Usuario registrado exitosamente: {user.correo} (ID: {user_id})")

        return {
            "message": "¡Cuenta creada con éxito!", 
            "user_id": user_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ ERROR en registro: {str(e)}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la cuenta: {str(e)}"
        )


@router.get("/test-db")
async def test_database():
    """Endpoint de prueba para verificar conexión a BD"""
    try:
        logger.info("🧪 Probando conexión a base de datos...")
        
        # Probar query simple
        from app.config.database import get_cursor
        async with get_cursor() as (conn, cursor):
            await cursor.execute("SELECT COUNT(*) as count FROM usuarios")
            result = await cursor.fetchone()
            user_count = result['count'] if result else 0
        
        logger.info(f"✅ Base de datos OK - {user_count} usuarios")
        
        return {
            "status": "✅ OK",
            "database": "Conectada",
            "usuarios": user_count
        }
    except Exception as e:
        logger.error(f"❌ Error en test-db: {str(e)}")
        return {
            "status": "❌ Error",
            "error": str(e)
        }