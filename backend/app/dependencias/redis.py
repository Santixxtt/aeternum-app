import redis
import os

IS_LOCAL = os.getenv("RAILWAY_ENVIRONMENT") is None

try:
    r = redis.Redis(
        host="crossover.proxy.rlwy.net",
        port=58201,
        password="yNnOdmFoFqSiobQgnVjOHccXRbGYWoSQ",
        ssl=not IS_LOCAL,
        socket_timeout=3, 
    )
    
    r.ping()
    print("✅ Redis conectado exitosamente")

except Exception as e:
    print("⚠️ Redis no disponible:", e)
    
    # 👉 Crea un mock para que la app no explote si Redis falla
    class FakeRedis:
        def get(self, *args, **kwargs): return None
        def setex(self, *args, **kwargs): pass
        def delete(self, *args, **kwargs): pass
        
    r = FakeRedis()
