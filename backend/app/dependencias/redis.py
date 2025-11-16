import redis.asyncio as redis
import os
from dotenv import load_dotenv
from typing import Optional, List
import asyncio

load_dotenv()

IS_LOCAL = os.getenv("RAILWAY_ENVIRONMENT") is None

redis_client: Optional[redis.Redis] = None


async def init_redis():
    """Inicializa la conexión async de Redis"""
    global redis_client
    
    try:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST"),
            port=int(os.getenv("REDIS_PORT")),
            password=os.getenv("REDIS_PASSWORD"),
            ssl=not IS_LOCAL,
            socket_timeout=3,
            decode_responses=True,  # Para recibir strings directamente
            max_connections=50,  # Pool de conexiones
        )
        
        await redis_client.ping()
        print("✅ Redis async conectado exitosamente")
        
    except Exception as e:
        print("⚠️ Redis no disponible:", e)
        redis_client = None


async def close_redis():
    """Cierra la conexión de Redis"""
    global redis_client
    if redis_client:
        await redis_client.close()
        print("✅ Redis desconectado")

async def get_cached(key: str) -> Optional[str]:
    """Obtiene un valor del caché de forma segura"""
    if not redis_client:
        return None
    
    try:
        return await redis_client.get(key)
    except Exception as e:
        print(f"⚠️ Error obteniendo caché {key}: {e}")
        return None


async def set_cached(key: str, value: str, ttl: int = 3600) -> bool:
    """Guarda un valor en caché con TTL"""
    if not redis_client:
        return False
    
    try:
        await redis_client.setex(key, ttl, value)
        return True
    except Exception as e:
        print(f"⚠️ Error guardando caché {key}: {e}")
        return False


async def delete_cached(key: str) -> bool:
    """Elimina una key del caché"""
    if not redis_client:
        return False
    
    try:
        await redis_client.delete(key)
        return True
    except Exception as e:
        print(f"⚠️ Error eliminando caché {key}: {e}")
        return False


async def delete_cached_pattern(pattern: str) -> int:
    """Elimina todas las keys que coincidan con un patrón"""
    if not redis_client:
        return 0
    
    try:
        keys = []
        async for key in redis_client.scan_iter(match=pattern):
            keys.append(key)
        
        if keys:
            return await redis_client.delete(*keys)
        return 0
    except Exception as e:
        print(f"⚠️ Error eliminando patrón {pattern}: {e}")
        return 0


async def delete_multiple_keys(keys: List[str]) -> int:
    """Elimina múltiples keys en una sola operación"""
    if not redis_client or not keys:
        return 0
    
    try:
        return await redis_client.delete(*keys)
    except Exception as e:
        print(f"⚠️ Error eliminando múltiples keys: {e}")
        return 0


async def increment_counter(key: str, ttl: int = 3600) -> int:
    """Incrementa un contador"""
    if not redis_client:
        return 0
    
    try:
        count = await redis_client.incr(key)
        await redis_client.expire(key, ttl)
        return count
    except Exception as e:
        print(f"⚠️ Error incrementando contador {key}: {e}")
        return 0


async def clear_user_cache(user_id: int):
    """Limpia todo el caché relacionado con un usuario"""
    if not redis_client:
        return
    
    keys = [
        f"user_session_invalid:{user_id}",
        f"login_attempts:{user_id}",
        f"account_locked:{user_id}",
        f"prestamos_fisicos_usuario:{user_id}",
        f"user_data:{user_id}",
        f"user_profile:{user_id}",
        f"user_loans:{user_id}",
    ]
    
    try:
        await delete_multiple_keys(keys)
    except Exception as e:
        print(f"⚠️ Error limpiando caché del usuario {user_id}: {e}")


async def invalidate_session(user_id: int, duration: int = 3600):
    """Marca una sesión como inválida"""
    await set_cached(f"user_session_invalid:{user_id}", "1", duration)


async def is_session_valid(user_id: int) -> bool:
    """Verifica si la sesión es válida"""
    invalid = await get_cached(f"user_session_invalid:{user_id}")
    return invalid is None



class RedisWrapper:
    """
    Wrapper para mantener compatibilidad con código legacy que usa r.get(), r.setex(), etc.
    IMPORTANTE: Esto es temporal, migra todo el código a las funciones async
    """
    
    def __init__(self):
        self._warned = False
    
    def _warn_sync(self):
        if not self._warned:
            print("⚠️ ADVERTENCIA: Usando Redis síncrono en contexto async. Migra a funciones async.")
            self._warned = True
    
    def get(self, key: str):
        self._warn_sync()
        if not redis_client:
            return None
        try:
            # Ejecutar sync en event loop actual (BLOQUEANTE)
            return asyncio.get_event_loop().run_until_complete(redis_client.get(key))
        except:
            return None
    
    def setex(self, key: str, ttl: int, value: str):
        self._warn_sync()
        if not redis_client:
            return
        try:
            asyncio.get_event_loop().run_until_complete(redis_client.setex(key, ttl, value))
        except:
            pass
    
    def delete(self, *keys):
        self._warn_sync()
        if not redis_client or not keys:
            return
        try:
            asyncio.get_event_loop().run_until_complete(redis_client.delete(*keys))
        except:
            pass
    
    def incr(self, key: str):
        self._warn_sync()
        if not redis_client:
            return 0
        try:
            return asyncio.get_event_loop().run_until_complete(redis_client.incr(key))
        except:
            return 0

r = RedisWrapper()