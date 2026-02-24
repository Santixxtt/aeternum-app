from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from app.scheduler import start_scheduler, stop_scheduler
from pathlib import Path  # ← AGREGAR

# Importar routers
from app.routes import (
    auth_routes,
    users_me,
    wishlist_router,
    review_routers,
    password_recovery_router,
    prestamo_router,
    prestamo_fisico_router,
    estadisticas_router,
    search_router
)
from app.routes.bibliotecario import users_router, book_router, catalogs, upload_routes

from app.config.database import init_db, close_db
from app.dependencias.redis import r

app = FastAPI(title="Aeternum API", version="1.0.0")

# ← AGREGAR ESTO: Crear directorios necesarios
UPLOAD_DIR = Path("uploads/book_covers")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
print(f"📁 Directorio de uploads creado/verificado: {UPLOAD_DIR.resolve()}")

# Configuración CORS
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://192.168.1.2:5173",
    "https://aeternum-app-production.up.railway.app",
    "https://aeternum.up.railway.app",
    "https://backend-production-9f93.up.railway.app",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]  
)

# Eventos de inicio y cierre
@app.on_event("startup")
async def on_startup():
    print("🚀 Iniciando aplicación Aeternum...")
    await init_db(app)
    FastAPICache.init(InMemoryBackend())  
    start_scheduler()
    print("✅ Aeternum iniciada con scheduler y cache")

@app.on_event("shutdown")
async def on_shutdown():
    stop_scheduler()
    await close_db()
    print("🛑 Aplicación detenida correctamente.")

# Rutas principales
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
app.include_router(search_router.router)

@app.get("/")
async def root():
    disponible = False
    try:
        r.ping()
        disponible = True
    except:
        disponible = False

    return {
        "message": "🚀 Aeternum API desplegada correctamente en Railway",
        "database": "✅ Conectada",
        "redis": "✅ Disponible" if disponible else "⚠️ Fallback local",

    }
