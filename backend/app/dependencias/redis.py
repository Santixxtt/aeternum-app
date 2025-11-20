import redis
import os
from dotenv import load_dotenv

load_dotenv()

IS_LOCAL = os.getenv("RAILWAY_ENVIRONMENT") is None

try:
    r = redis.Redis(
        host=os.getenv("REDIS_HOST"),
        port=int(os.getenv("REDIS_PORT")),
        password=os.getenv("REDIS_PASSWORD"),
        ssl=not IS_LOCAL,
        socket_timeout=3,
    )
    
    r.ping()
    print("✅ Redis conectado exitosamente")

except Exception as e:
    print("⚠️ Redis no disponible:", e)
    
    # Mock de Redis para evitar que la app falle
    class FakeRedis:
        def get(self, *args, **kwargs): return None
        def setex(self, *args, **kwargs): pass
        def delete(self, *args, **kwargs): pass

    r = FakeRedis()
