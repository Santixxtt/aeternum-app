from datetime import datetime, timedelta
from app.config.database import get_cursor
from typing import Optional, Dict, Any

# 🔹 Obtener usuario por correo
async def get_user_by_email(email: str):
    async with get_cursor() as (conn, cursor):
        await cursor.execute("SELECT * FROM usuarios WHERE correo = %s", (email,))
        user = await cursor.fetchone()
        return user


# 🔹 Verificar si un correo ya existe
async def email_exists(email: str) -> bool:
    async with get_cursor() as (conn, cursor):
        await cursor.execute("SELECT id FROM usuarios WHERE correo = %s", (email,))
        exists = await cursor.fetchone()
        return exists is not None


# 🔹 Verificar si un número de identificación ya existe
async def id_exists(numeroId: str) -> bool:
    async with get_cursor() as (conn, cursor):
        await cursor.execute("SELECT id FROM usuarios WHERE num_identificacion = %s", (numeroId,))
        exists = await cursor.fetchone()
        return exists is not None


# 🔹 Crear un nuevo usuario
async def create_user(data: dict) -> int:
    async with get_cursor() as (conn, cursor):
        sql = """
            INSERT INTO usuarios (nombre, apellido, tipo_identificacion, num_identificacion, correo, clave, rol)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        await cursor.execute(sql, (
            data["nombre"],
            data["apellido"],
            data["tipo_identificacion"],
            data["num_identificacion"],
            data["correo"],
            data["clave"],
            data["rol"]
        ))
        await conn.commit()
        return cursor.lastrowid


# 🔹 Guardar consentimiento de privacidad
async def save_consent(user_id: int, consent_text: str, ip: str, user_agent: str):
    async with get_cursor() as (conn, cursor):
        sql = """
            INSERT INTO consents (user_id, consent_key, consent_text, granted, ip_address, user_agent)
            VALUES (%s, %s, %s, 1, %s, %s)
        """
        await cursor.execute(sql, (user_id, "privacy_policy_v1", consent_text, ip, user_agent))
        await conn.commit()


# 🔹 Incrementar intentos fallidos de login
async def increment_login_attempts(user_id: int, max_attempts: int, lock_minutes: int):
    async with get_cursor() as (conn, cursor):
        await cursor.execute("SELECT intentos_fallidos FROM usuarios WHERE id = %s", (user_id,))
        row = await cursor.fetchone()
        if not row:
            return

        attempts = row.get("intentos_fallidos") or 0

        if attempts + 1 >= max_attempts:
            bloqueado_hasta = datetime.now() + timedelta(minutes=lock_minutes)
            await cursor.execute(
                "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = %s WHERE id = %s",
                (bloqueado_hasta.strftime("%Y-%m-%d %H:%M:%S"), user_id)
            )
        else:
            await cursor.execute(
                "UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = %s",
                (user_id,)
            )
        await conn.commit()


# 🔹 Resetear intentos fallidos de login
async def reset_login_attempts(user_id: int):
    async with get_cursor() as (conn, cursor):
        await cursor.execute(
            "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = %s",
            (user_id,)
        )
        await conn.commit()


# 🔹 Obtener usuario por ID
async def get_user_by_id(user_id: int):
    async with get_cursor() as (conn, cursor):
        await cursor.execute(
            "SELECT id, nombre, apellido, correo, rol, tipo_identificacion, num_identificacion, estado FROM usuarios WHERE id = %s",
            (user_id,)
        )
        user = await cursor.fetchone()
        return user

async def update_password(user_id: int, hashed_password: str) -> bool:
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("UPDATE usuarios SET clave = %s WHERE id = %s", (hashed_password, user_id))
            await conn.commit()
            return True
        except Exception as e:
            print(f"Error update_password: {e}")
            await conn.rollback()
            return False

async def update_user_by_id(
    user_id: int,
    nombre: str,
    apellido: str,
    correo: str,
    tipo_identificacion: Optional[str] = None,
    num_identificacion: Optional[str] = None
) -> bool:
    """
    Actualiza los campos permitidos del usuario.
    Retorna True si se actualizó al menos una fila.
    """
    async with get_cursor() as (conn, cursor):
        try:
            # Construimos query dinámica para no sobrescribir con NULL cuando no viene
            fields = ["nombre = %s", "apellido = %s", "correo = %s"]
            params = [nombre, apellido, correo]

            if tipo_identificacion is not None:
                fields.append("tipo_identificacion = %s")
                params.append(tipo_identificacion)

            if num_identificacion is not None:
                fields.append("num_identificacion = %s")
                params.append(num_identificacion)

            params.append(user_id)

            sql = f"UPDATE usuarios SET {', '.join(fields)} WHERE id = %s"
            await cursor.execute(sql, tuple(params))
            await conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            await conn.rollback()
            print("❌ Error update_user_by_id:", e)
            return False


async def deactivate_user_by_id(user_id: int) -> bool:
    """
    Marca el usuario como 'Desactivado'.
    """
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute(
                "UPDATE usuarios SET estado = 'Desactivado' WHERE id = %s", (user_id,)
            )
            await conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            await conn.rollback()
            print("❌ Error deactivate_user_by_id:", e)
            return False
        
async def reactivate_user_by_id(user_id: int) -> bool:
    """
    Cambia el estado del usuario a 'Activo'.
    """
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute(
                "UPDATE usuarios SET estado = 'Activo' WHERE id = %s", (user_id,)
            )
            await conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            await conn.rollback()
            print("❌ Error reactivate_user_by_id:", e)
            return False
