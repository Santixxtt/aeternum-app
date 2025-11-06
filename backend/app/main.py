from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, users_me, wishlist_router, review_routers, password_recovery_router, prestamo_router, prestamo_fisico_router, estadisticas_router
from app.routes.bibliotecario import users_router, book_router, catalogs
from app.config.database import init_db, close_db
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5173",
    "http://192.168.1.2:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar y cerrar el pool
@app.on_event("startup")
async def startup_event():
    await init_db(app)
    FastAPICache.init(InMemoryBackend())

@app.on_event("shutdown")
async def shutdown_event():
    await close_db()

# Routers
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