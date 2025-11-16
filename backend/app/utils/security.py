import os
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.config.database import get_cursor    
from app.models import user_model 
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "AETERNUM_SUPER_SECRET_KEY_2025")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": True})
        user_id: str = payload.get("sub")
        rol: str = payload.get("rol") or payload.get("role")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido o expirado.")
        
        if rol is None:
            raise HTTPException(status_code=401, detail="Token sin rol asignado.")
        
        # 🔥 CRÍTICO: Verificar sesión invalidada ANTES de consultar BD
        from app.dependencias.redis import r
        session_invalid_key = f"user_session_invalid:{user_id}"
        
        session_invalid_value = r.get(session_invalid_key)
        print(f"🔍 Verificando sesión usuario {user_id}: user_session_invalid={session_invalid_value}")
        
        if session_invalid_value:
            print(f"⛔ Usuario {user_id} tiene sesión invalidada en Redis")
            raise HTTPException(
                status_code=401, 
                detail="Tu sesión ha sido cerrada por el administrador. Inicia sesión nuevamente."
            )
        
        # 🔥 IMPORTANTE: SIEMPRE consultar BD - NO usar caché aquí
        async with get_cursor() as (conn, cursor):
            # 🔍 LOG: Ver query exacta
            query = "SELECT estado, motivo_bloqueo FROM usuarios WHERE id = %s"
            print(f"🔍 Ejecutando query: {query} con user_id={user_id}")
            
            await cursor.execute(query, (int(user_id),))
            user_data = await cursor.fetchone()
            
            if not user_data:
                print(f"⚠️ Usuario {user_id} NO encontrado en BD")
                raise HTTPException(status_code=401, detail="Usuario no encontrado.")
            
            estado_actual = user_data["estado"]
            print(f"🔍 Usuario {user_id} - Estado en BD: {estado_actual}")
            
            # 🔥 NUEVO: Ver si el estado cambió desde el último check
            cache_estado_key = f"last_estado_check:{user_id}"
            ultimo_estado = r.get(cache_estado_key)
            
            if ultimo_estado and ultimo_estado.decode('utf-8') != estado_actual:
                print(f"⚠️ CAMBIO DE ESTADO DETECTADO para usuario {user_id}:")
                print(f"   - Último estado conocido: {ultimo_estado.decode('utf-8')}")
                print(f"   - Estado actual en BD: {estado_actual}")
            
            # Guardar estado actual para tracking
            r.setex(cache_estado_key, 60, estado_actual)  # 60 segundos
            
            if estado_actual == "Desactivado":
                print(f"⛔ Usuario {user_id} está desactivado")
                raise HTTPException(
                    status_code=403, 
                    detail="Tu cuenta ha sido desactivada. Contacta al administrador."
                )
            
            if estado_actual == "Bloqueado":
                motivo = user_data.get("motivo_bloqueo", "Cuenta bloqueada")
                print(f"⛔ Usuario {user_id} está bloqueado: {motivo}")
                raise HTTPException(
                    status_code=403, 
                    detail=f"Tu cuenta está bloqueada. Motivo: {motivo}. Contacta a la biblioteca."
                )
        
        print(f"✅ Usuario {user_id} validado correctamente con estado: {estado_actual}")
        return {
            "sub": user_id,
            "rol": rol
        }
        
    except HTTPException:
        raise
    except JWTError as e:
        print(f"❌ Error JWT: {e}")
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
    except Exception as e:
        print(f"❌ Error inesperado en get_current_user: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error interno del servidor.")

pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__rounds=12 
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password[:72], hashed)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)