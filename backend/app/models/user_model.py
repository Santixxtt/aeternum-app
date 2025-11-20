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


# 🔹 Crear un nuevo usuario (✅ MODIFICADO para soportar estado)
async def create_user(data: dict) -> int:
    async with get_cursor() as (conn, cursor):
        # Si no se especifica estado, usar 'Activo' por defecto (retrocompatibilidad)
        estado = data.get("estado", "Activo")
        
        sql = """
            INSERT INTO usuarios (nombre, apellido, tipo_identificacion, num_identificacion, correo, clave, rol, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        await cursor.execute(sql, (
            data["nombre"],
            data["apellido"],
            data["tipo_identificacion"],
            data["num_identificacion"],
            data["correo"],
            data["clave"],
            data["rol"],
            estado
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


# 🔹 Obtener usuario por ID (✅ FUNCIÓN ÚNICA)
async def get_user_by_id(user_id: int):
    async with get_cursor() as (conn, cursor):
        await cursor.execute(
            "SELECT * FROM usuarios WHERE id = %s",
            (user_id,)
        )
        user = await cursor.fetchone()
        return user


# 🔹 Actualizar contraseña
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


# 🔹 Actualizar datos del usuario
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


# 🔹 Desactivar usuario
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


# 🔹 Reactivar usuario
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


# 🔹 Actualizar estado del usuario (✅ NUEVA - Para verificación de email)
async def update_user_status(user_id: int, new_status: str) -> bool:
    """
    Actualiza el estado de un usuario.
    """
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute(
                "UPDATE usuarios SET estado = %s WHERE id = %s", 
                (new_status, user_id)
            )
            await conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            await conn.rollback()
            print("❌ Error update_user_status:", e)
            return False


# 🔹 Eliminar usuario (✅ NUEVA - Para rollback si falla el email)
async def delete_user(user_id: int) -> bool:
    """
    Elimina un usuario (usado para rollback si falla el envío de email).
    """
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("DELETE FROM usuarios WHERE id = %s", (user_id,))
            await conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            await conn.rollback()
            print("❌ Error delete_user:", e)
            return False

# Agregar estos métodos al final de tu archivo user_model.py

async def save_verification_token(user_id: int, token: str, expires_at):
    """Guarda o actualiza el token de verificación de un usuario"""
    query = """
        INSERT INTO email_verification_tokens (user_id, token, expires_at, used)
        VALUES (%s, %s, %s, FALSE)
        ON DUPLICATE KEY UPDATE
            token = VALUES(token),
            expires_at = VALUES(expires_at),
            used = FALSE,
            created_at = CURRENT_TIMESTAMP
    """
    async with get_cursor() as (conn, cursor):
        await cursor.execute(query, (user_id, token, expires_at))
        await conn.commit()


async def get_verification_token(user_id: int):
    """Obtiene el token de verificación más reciente de un usuario"""
    query = """
        SELECT token, expires_at, used
        FROM email_verification_tokens
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
    """
    async with get_cursor() as (conn, cursor):
        await cursor.execute(query, (user_id,))
        result = await cursor.fetchone()
        return result


async def mark_token_as_used(user_id: int):
    """Marca el token como usado"""
    query = """
        UPDATE email_verification_tokens
        SET used = TRUE
        WHERE user_id = %s
    """
    async with get_cursor() as (conn, cursor):
        await cursor.execute(query, (user_id,))
        await conn.commit()