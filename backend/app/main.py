from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

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
)
from app.routes.bibliotecario import users_router, book_router, catalogs

# Configuración base de datos
from app.config.database import init_db, close_db

# Redis (con fallback automático)
from app.dependencias.redis import r

# Inicialización principal de la aplicación FastAPI

app = FastAPI(title="Aeternum API", version="1.0.0")


# Configuración CORS

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://aeternum.vercel.app",  # 👈 agrega aquí el dominio del frontend si lo vas a subir
    "https://aeternum-app-production.up.railway.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Eventos de inicio y cierre
@app.on_event("startup")
async def startup_event():
    print(" Iniciando aplicación Aeternum...")
    await init_db(app)
    FastAPICache.init(InMemoryBackend())  # cache local segura
    print(" Cache en memoria inicializada.")

@app.on_event("shutdown")
async def shutdown_event():
    await close_db()
    print("🧹 Aplicación detenida correctamente.")


#  Rutas principales

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


#  Ruta raíz (necesaria para Railway)
@app.get("/")
async def root():
    return {
        "message": "🚀 Aeternum API desplegada correctamente en Railway",
        "database": "✅ Conectada",
        "redis": "✅ Disponible" if hasattr(r, "ping") else "⚠️ Fallback local",
    }
