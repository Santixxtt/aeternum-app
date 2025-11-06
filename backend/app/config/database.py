import os
from contextlib import asynccontextmanager
import aiomysql
from dotenv import load_dotenv

# 🔹 Buscar el archivo .env subiendo hasta 3 niveles si es necesario
def find_env_file():
    current_dir = os.path.abspath(os.path.dirname(__file__))
    for _ in range(3):
        env_path = os.path.join(current_dir, ".env")
        if os.path.exists(env_path):
            return env_path
        current_dir = os.path.dirname(current_dir)
    return None

env_file = find_env_file()
print(f"🧩 Intentando cargar .env desde: {env_file}")
if env_file:
    load_dotenv(env_file)
else:
    print("⚠️ No se encontró el archivo .env")

pool = None


async def init_db(app):
    global pool
    print("🧩 Cargando variables de entorno...")

    pool = await aiomysql.create_pool(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        db=os.getenv("DB_NAME"),
        minsize=1,
        maxsize=10,
    )
    print("✅ Pool de conexiones MySQL inicializado.")


@asynccontextmanager
async def get_cursor():
    global pool
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            yield conn, cursor


async def close_db():
    global pool
    if pool is not None:
        pool.close()
        await pool.wait_closed()
        pool = None
        print("🧹 Pool de conexiones cerrado.")
