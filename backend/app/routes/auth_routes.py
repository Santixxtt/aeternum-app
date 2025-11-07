from fastapi import APIRouter, HTTPException, Request
from app.models import user_model
from app.utils.security import verify_password, hash_password, create_access_token
from datetime import datetime
from app.schemas.user_schema import UserLogin, UserRegister
from app.dependencias.redis import r

router = APIRouter(prefix="/auth", tags=["Auth"])

MAX_ATTEMPTS = 3
LOCK_TIME_SECONDS = 15 * 60

def safe_redis_get(key: str, default=None):
    try:
        value = r.get(key)
        return value if value is not None else default
    except:
        return default

def safe_redis_setex(key: str, time: int, value):
    try:
        r.setex(key, time, value)
        return True
    except:
        return False

def safe_redis_delete(key: str):
    try:
        r.delete(key)
        return True
    except:
        return False

@router.post("/login")
async def login(user_data: UserLogin):
    try:
        # Buscar usuario
        user = await user_model.get_user_by_email(user_data.correo)
        if not user:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")

        # Verificar estado
        if user.get("estado") == "Desactivado":
            raise HTTPException(status_code=403, detail="Cuenta desactivada.")

        user_id = user["id"]
        attempts_key = f"login_attempts:{user_id}"
        lock_key = f"account_locked:{user_id}"

        # Verificar bloqueo
        if safe_redis_get(lock_key):
            raise HTTPException(status_code=403, detail="Cuenta bloqueada. Intenta más tarde.")

        # Intentos fallidos
        attempts = int(safe_redis_get(attempts_key, 0) or 0)

        # Verificar que existe el hash
        stored_hash = user.get("clave")
        if not stored_hash:
            raise HTTPException(status_code=500, detail="Cuenta sin contraseña configurada")
        
        # Validar formato del hash (bcrypt debe empezar con $2)
        if not stored_hash.startswith('$2'):
            print(f"⚠️ Hash inválido para {user_data.correo}: {stored_hash[:20]}...")
            raise HTTPException(
                status_code=500, 
                detail="Contraseña mal configurada. Contacta al administrador."
            )
        
        # Verificar longitud del hash
        print(f"🔍 Longitud del hash: {len(stored_hash)}")
        print(f"🔍 Longitud de password ingresado: {len(user_data.clave)}")
        
        # Verificar contraseña
        try:
            password_match = verify_password(user_data.clave, stored_hash)
        except Exception as e:
            print(f"❌ Error en verify_password: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error verificando contraseña: {str(e)}")
        
        if not password_match:
            attempts += 1
            safe_redis_setex(attempts_key, LOCK_TIME_SECONDS, attempts)
            remaining = MAX_ATTEMPTS - attempts

            if attempts >= MAX_ATTEMPTS:
                safe_redis_setex(lock_key, LOCK_TIME_SECONDS, "1")
                raise HTTPException(status_code=403, detail="Cuenta bloqueada por intentos fallidos.")

            raise HTTPException(status_code=401, detail=f"Clave incorrecta. Intentos restantes: {remaining}")

        # Login exitoso
        safe_redis_delete(attempts_key)
        safe_redis_delete(lock_key)

        # Generar token
        token = create_access_token({
            "sub": str(user_id),
            "correo": user["correo"],
            "rol": user["rol"]
        })

        return {
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

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR en login: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/register")
async def register_user(user: UserRegister, request: Request):
    try:
        if not user.consent:
            raise HTTPException(status_code=400, detail="Debes aceptar la Política de Privacidad.")

        # Verificar duplicados
        if await user_model.email_exists(user.correo):
            raise HTTPException(status_code=400, detail="El correo ya está registrado.")
        
        if await user_model.id_exists(user.num_identificacion):
            raise HTTPException(status_code=400, detail="El número de identificación ya está registrado.")

        # Hash de contraseña
        hashed = hash_password(user.clave)

        # Crear usuario
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

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR en registro: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al crear la cuenta")


@router.get("/test")
async def test_endpoint():
    """Endpoint simple de prueba"""
    return {"status": "OK", "message": "Auth router funcionando"}


@router.post("/debug/create-test-user")
async def create_test_user():
    """
    Crea un usuario de prueba con contraseña correctamente hasheada.
    TEMPORAL - ELIMINAR EN PRODUCCIÓN
    """
    try:
        test_email = "test@aeternum.com"
        test_password = "Test1234"
        
        # Verificar si ya existe
        existing = await user_model.get_user_by_email(test_email)
        
        if existing:
            # Actualizar contraseña
            hashed = hash_password(test_password)
            await user_model.update_password(existing['id'], hashed)
            return {
                "message": "Usuario actualizado",
                "email": test_email,
                "password": test_password,
                "hash_length": len(hashed),
                "hash_prefix": hashed[:30]
            }
        else:
            # Crear nuevo
            hashed = hash_password(test_password)
            user_id = await user_model.create_user({
                "nombre": "Test",
                "apellido": "User",
                "tipo_identificacion": "CC",
                "num_identificacion": "9999999999",
                "correo": test_email,
                "clave": hashed,
                "rol": "usuario"
            })
            return {
                "message": "Usuario creado",
                "user_id": user_id,
                "email": test_email,
                "password": test_password,
                "hash_length": len(hashed),
                "hash_prefix": hashed[:30]
            }
    except Exception as e:
        return {"error": str(e)}