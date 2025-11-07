from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os

# Configuración de bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración JWT
SECRET_KEY = os.getenv("SECRET_KEY", "AETERNUM_SUPER_SECRET_KEY_2025")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))


def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt.
    Trunca a 72 bytes considerando UTF-8 encoding.
    """
    try:
        # Convertir a bytes y truncar a 72 bytes
        password_bytes = password.encode('utf-8')
        
        # Si excede 72 bytes, truncar de forma segura
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
            # Decodificar de forma segura manejando bytes incompletos
            password = password_bytes.decode('utf-8', errors='ignore')
        
        # Hashear
        hashed = pwd_context.hash(password)
        return hashed
        
    except Exception as e:
        print(f"❌ Error hasheando contraseña: {str(e)}")
        print(f"   Longitud original: {len(password)}")
        print(f"   Bytes: {len(password.encode('utf-8'))}")
        raise Exception(f"Error al hashear contraseña: {str(e)}")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica que la contraseña en texto plano coincida con el hash.
    
    Args:
        plain_password: Contraseña en texto plano del usuario
        hashed_password: Hash almacenado en la base de datos
    
    Returns:
        True si coinciden, False si no
    """
    try:
        # Truncar contraseña a 72 bytes
        password_bytes = plain_password.encode('utf-8')[:72]
        password_truncated = password_bytes.decode('utf-8', errors='ignore')
        
        # Verificar que el hash tenga el formato correcto de bcrypt
        if not hashed_password or not hashed_password.startswith('$2'):
            print(f"⚠️ Hash inválido o vacío")
            return False
        
        # Verificar contraseña
        return pwd_context.verify(password_truncated, hashed_password)
        
    except Exception as e:
        print(f"❌ Error verificando contraseña: {str(e)}")
        return False


def create_access_token(data: dict) -> str:
    """
    Crea un token JWT con los datos proporcionados.
    
    Args:
        data: Diccionario con los datos a incluir en el token
    
    Returns:
        Token JWT como string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decodifica un token JWT.
    
    Args:
        token: Token JWT como string
    
    Returns:
        Diccionario con los datos del token
    
    Raises:
        JWTError si el token es inválido o ha expirado
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token expirado")
    except jwt.JWTError as e:
        raise Exception(f"Token inválido: {str(e)}")