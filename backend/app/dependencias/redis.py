import redis
import os
from dotenv import load_dotenv

# Cargar .env solo si existe (para desarrollo local)
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

# Detectar si estamos en Railway
IS_RAILWAY = os.getenv("RAILWAY_ENVIRONMENT") is not None

try:
    r = redis.Redis(
        host=os.getenv("REDIS_HOST"),
        port=int(os.getenv("REDIS_PORT")),
        password=os.getenv("REDIS_PASSWORD"),
        ssl=IS_RAILWAY,           # usar SSL solo en Railway
        socket_timeout=2,         # tiempo de espera más corto
        socket_connect_timeout=2, # evita bloqueos prolongados
    )
    r.ping()
    print("✅ Redis conectado exitosamente")

except Exception as e:
    print("⚠️ Redis no disponible:", e)

    class FakeRedis:
        def get(self, *args, **kwargs): return None
        def setex(self, *args, **kwargs): pass
        def delete(self, *args, **kwargs): pass

    r = FakeRedis()
