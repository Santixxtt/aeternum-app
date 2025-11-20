import redis
import os
from dotenv import load_dotenv

load_dotenv()

IS_LOCAL = os.getenv("RAILWAY_ENVIRONMENT") is None

r = None

class FakeRedis:
    """Mock de Redis cuando no está disponible"""
    def get(self, *args, **kwargs): 
        return None
    def setex(self, *args, **kwargs): 
        return False
    def delete(self, *args, **kwargs): 
        return False
    def scan_iter(self, *args, **kwargs): 
        return []
    def keys(self, *args, **kwargs):
        return []
    def ping(self):
        """Simular ping para FakeRedis"""
        raise Exception("FakeRedis activo - Redis no disponible")

def conectar_redis():
    global r
    
    redis_host = os.getenv("REDIS_HOST")
    redis_port = os.getenv("REDIS_PORT")
    redis_password = os.getenv("REDIS_PASSWORD")
    
    print(f"🔍 Intentando conectar a Redis:")
    print(f"   Host: {redis_host}")
    print(f"   Port: {redis_port}")
    print(f"   Password: {'***' if redis_password else 'NO CONFIGURADO'}")
    print(f"   SSL: {not IS_LOCAL}")
    print(f"   RAILWAY_ENVIRONMENT: {os.getenv('RAILWAY_ENVIRONMENT', 'NO DEFINIDO')}")
    
    try:
        r = redis.Redis(
            host=redis_host,
            port=int(redis_port),
            password=redis_password,
            ssl=not IS_LOCAL,
            decode_responses=True,  # ✅ IMPORTANTE: Retorna strings en lugar de bytes
            socket_timeout=5,
            socket_connect_timeout=5,
        )
        
        # Probar conexión
        r.ping()
        print("✅ Redis conectado exitosamente")
        
        # Test de escritura/lectura
        test_key = "test_connection"
        r.setex(test_key, 10, "test_value")
        test_value = r.get(test_key)
        r.delete(test_key)
        
        if test_value == "test_value":
            print("✅ Redis funcionando correctamente (test de lectura/escritura exitoso)")
        else:
            print(f"⚠️ Redis conectado pero test falló: esperado 'test_value', recibido '{test_value}'")
            
    except redis.ConnectionError as e:
        print(f"❌ Error de conexión a Redis: {e}")
        print("⚠️ Usando FakeRedis - Las funciones que dependen de Redis NO funcionarán")
        r = FakeRedis()
    except Exception as e:
        print(f"❌ Error inesperado con Redis: {e}")
        print("⚠️ Usando FakeRedis - Las funciones que dependen de Redis NO funcionarán")
        r = FakeRedis()

    return r

# Llamar solo al iniciar
r = conectar_redis()