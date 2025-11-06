from datetime import datetime, timedelta
from app.config.database import get_cursor

RECOVERY_EXPIRY_HOURS = 1
RECOVERY_TABLE = "solicitudes_recuperacion_contrasena"


async def create_recovery_request(user_id: int, token: str):
    """Crea una nueva solicitud de recuperación en la base de datos."""
    expiry_time = datetime.now() + timedelta(hours=RECOVERY_EXPIRY_HOURS)

    # CORRECCIÓN: Usar async with en lugar de async for
    async with get_cursor() as (conn, cursor):
        try:
            query = f"""
                INSERT INTO {RECOVERY_TABLE} 
                (usuario_id, token, fecha, fecha_expiracion, usado) 
                VALUES (%s, %s, %s, %s, %s)
            """
            await cursor.execute(query, (user_id, token, datetime.now(), expiry_time, 0))
            await conn.commit()
        except Exception as e:
            print(f"❌ Error creando solicitud de recuperación: {e}")
            await conn.rollback()
        finally:
            pass


async def get_recovery_request_by_token(token: str):
    """Obtiene una solicitud válida (no usada y no expirada) por token."""
    # CORRECCIÓN: Usar async with en lugar de async for
    async with get_cursor() as (conn, cursor):
        try:
            query = f"""
                SELECT * FROM {RECOVERY_TABLE} 
                WHERE token = %s AND usado = 0 AND fecha_expiracion > %s
            """
            await cursor.execute(query, (token, datetime.now()))
            recovery = await cursor.fetchone()
            return recovery
        except Exception as e:
            print(f"❌ Error al buscar token de recuperación: {e}")
            return None
        finally:
            # El async with se encarga de cerrar.
            pass


async def mark_token_as_used(token: str):
    """Marca un token como usado tras restablecer la contraseña."""
    # CORRECCIÓN: Usar async with en lugar de async for
    async with get_cursor() as (conn, cursor):
        try:
            query = f"UPDATE {RECOVERY_TABLE} SET usado = 1 WHERE token = %s"
            await cursor.execute(query, (token,))
            await conn.commit()
        except Exception as e:
            print(f"❌ Error al marcar token como usado: {e}")
            await conn.rollback()
        finally:
            pass
