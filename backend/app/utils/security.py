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
        
        # 🔥 NUEVO: Verificar si la sesión fue invalidada manualmente
        from app.dependencias.redis import r
        if r.get(f"user_session_invalid:{user_id}"):
            raise HTTPException(
                status_code=401, 
                detail="Tu sesión ha sido cerrada por el administrador. Inicia sesión nuevamente."
            )
        
        # Verificar estado actual del usuario en BD
        async with get_cursor() as (conn, cursor):
            await cursor.execute(
                "SELECT estado, motivo_bloqueo FROM usuarios WHERE id = %s",
                (int(user_id),)
            )
            user_data = await cursor.fetchone()
            
            if not user_data:
                raise HTTPException(status_code=401, detail="Usuario no encontrado.")
            
            if user_data["estado"] == "Desactivado":
                raise HTTPException(
                    status_code=403, 
                    detail="Tu cuenta ha sido desactivada. Contacta al administrador."
                )
            
            if user_data["estado"] == "Bloqueado":
                motivo = user_data.get("motivo_bloqueo", "Cuenta bloqueada")
                raise HTTPException(
                    status_code=403, 
                    detail=f"Tu cuenta está bloqueada. Motivo: {motivo}. Contacta a la biblioteca."
                )
        
        return {
            "sub": user_id,
            "rol": rol
        }
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")

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