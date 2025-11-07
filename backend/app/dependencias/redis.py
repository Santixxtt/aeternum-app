import redis
import logging
import os

logger = logging.getLogger(__name__)

def create_redis_client():
    """Crea cliente Redis con manejo robusto de errores"""
    try:
        redis_host = os.getenv("REDIS_HOST")
        redis_port = os.getenv("REDIS_PORT")
        redis_password = os.getenv("REDIS_PASSWORD")
        
        # Detectar si estamos en Railway
        is_railway = os.getenv("RAILWAY_ENVIRONMENT") is not None
        
        if redis_host and redis_port and redis_password:
            logger.info(f"🔌 Conectando a Redis: {redis_host}:{redis_port}")
            
            client = redis.Redis(
                host=redis_host,
                port=int(redis_port),
                password=redis_password,
                decode_responses=True,
                ssl=is_railway,  # SSL solo en Railway
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Probar conexión
            client.ping()
            logger.info("✅ Redis conectado correctamente")
            return client
            
        # Fallback: Redis local
        elif os.getenv("REDIS_URL"):
            redis_url = os.getenv("REDIS_URL")
            logger.info(f"🔌 Conectando a Redis (URL): {redis_url}")
            
            client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            client.ping()
            logger.info("✅ Redis conectado correctamente (URL)")
            return client
        
        else:
            logger.warning("⚠️ Variables de Redis no encontradas")
            raise Exception("Redis no configurado")
            
    except Exception as e:
        logger.warning(f"⚠️ Redis no disponible: {str(e)}")
        logger.warning("⚠️ Usando stub sin Redis - las funciones de bloqueo no funcionarán")
        
        # Stub que no hace nada
        class RedisStub:
            def get(self, key): 
                return None
            def setex(self, key, time, value): 
                return True
            def delete(self, key): 
                return True
            def ping(self): 
                return True
        
        return RedisStub()

# Inicializar cliente global
r = create_redis_client()