from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from app.dependencias.redis import init_redis, close_redis, redis_client
from app.scheduler import start_scheduler, stop_scheduler
from fastapi.staticfiles import StaticFiles

from app.routes import (
    auth_routes,
    users_me,
    wishlist_router,
    review_routers,
    password_recovery_router,
    prestamo_router,
    prestamo_fisico_router,
    estadisticas_router,
)
from app.routes.bibliotecario import users_router, book_router, catalogs, upload_routes
from app.config.database import init_db, close_db

app = FastAPI(title="Aeternum API", version="1.0.0")

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://192.168.1.2:5173",  
    "http://192.168.1.2:8000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]  
)

@app.on_event("startup")
async def startup_event():
    await init_db(app)
    await init_redis()
    FastAPICache.init(InMemoryBackend())
    
    try:
        start_scheduler()
    except Exception as e:
        print(f"Error iniciando scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    try:
        stop_scheduler()
    except Exception as e:
        print(f"Error deteniendo scheduler: {e}")
    
    await close_redis()
    await close_db()

app.include_router(auth_routes.router)
app.include_router(users_me.router)
app.include_router(wishlist_router.router)
app.include_router(review_routers.router)
app.include_router(password_recovery_router.router)
app.include_router(prestamo_router.router)
app.include_router(prestamo_fisico_router.router)
app.include_router(estadisticas_router.router)
app.include_router(users_router.router)
app.include_router(book_router.router)
app.include_router(catalogs.router)
app.include_router(upload_routes.router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    redis_status = "Desconectado"
    if redis_client:
        try:
            await redis_client.ping()
            redis_status = "Conectado"
        except:
            redis_status = "Error de conexión"
    
    return {
        "message": "Aeternum API",
        "status": "online",
        "version": "1.0.0",
        "services": {
            "database": "Conectada",
            "redis": redis_status,
            "cache": "Activo",
        }
    }