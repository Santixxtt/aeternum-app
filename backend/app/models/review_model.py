from app.config.database import get_cursor

# 🟢 Insertar o actualizar calificación
async def insert_rating(usuario_id: int, libro_id: int, puntuacion: float) -> bool:
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                INSERT INTO calificaciones (usuario_id, libro_id, puntuacion)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE puntuacion = VALUES(puntuacion)
            """, (usuario_id, libro_id, puntuacion))
            await conn.commit()
            return True
        except Exception as e:
            print(f"❌ Error al insertar/actualizar calificación: {e}")
            await conn.rollback()
            return False


# 🟢 Obtener promedio y cantidad de votos
async def get_average_rating(libro_id: int) -> dict:
    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                AVG(puntuacion) AS promedio,
                COUNT(id) AS total_votos
            FROM calificaciones
            WHERE libro_id = %s
        """, (libro_id,))
        result = await cursor.fetchone()

    if result and result["promedio"] is not None:
        return {
            "promedio": round(float(result["promedio"]), 1),
            "total_votos": int(result["total_votos"])
        }
    return {"promedio": 0.0, "total_votos": 0}


# 🟢 Obtener calificación de un usuario
async def get_user_rating(usuario_id: int, libro_id: int) -> int | None:
    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT puntuacion FROM calificaciones
            WHERE usuario_id = %s AND libro_id = %s
        """, (usuario_id, libro_id))
        result = await cursor.fetchone()
        return int(result["puntuacion"]) if result else None


# 🟢 Insertar comentario
async def insert_comment(usuario_id: int, libro_id: int, texto: str) -> bool:
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                INSERT INTO comentarios (usuario_id, libro_id, texto, fecha_comentario)
                VALUES (%s, %s, %s, NOW())
            """, (usuario_id, libro_id, texto))
            await conn.commit()
            return True
        except Exception as e:
            print(f"❌ Error DB al insertar comentario: {e}")
            await conn.rollback()
            return False


# 🟢 Obtener todos los comentarios de un libro
async def get_comments_by_book(libro_id: int) -> list[dict]:
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT 
                    c.id,
                    c.texto,
                    c.fecha_comentario,
                    u.nombre AS nombre_usuario,
                    c.usuario_id
                FROM comentarios c
                INNER JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.libro_id = %s
                ORDER BY c.fecha_comentario DESC
            """, (libro_id,))
            comments = await cursor.fetchall()
            return comments or []
        except Exception as e:
            print(f"❌ Error al obtener comentarios: {e}")
            return []

# 🟢 NUEVO: Actualizar comentario
async def update_comment(comment_id: int, usuario_id: int, new_text: str) -> bool:
    """Actualiza el texto de un comentario, solo si el usuario_id coincide."""
    async with get_cursor() as (conn, cursor):
        try:
            # ❗ Solo actualiza si el ID del comentario y el ID del usuario coinciden
            await cursor.execute("""
                UPDATE comentarios 
                SET texto = %s
                WHERE id = %s AND usuario_id = %s
            """, (new_text, comment_id, usuario_id))
            
            # rowcount > 0 indica que se actualizó al menos una fila
            if cursor.rowcount > 0:
                await conn.commit()
                return True
            
            # Si rowcount es 0, el comentario no existe o no pertenece a ese usuario
            return False
            
        except Exception as e:
            print(f"❌ Error DB al actualizar comentario: {e}")
            await conn.rollback()
            return False


# 🟢 NUEVO: Eliminar comentario
async def delete_comment(comment_id: int, usuario_id: int) -> bool:
    """Elimina un comentario, solo si el usuario_id coincide."""
    async with get_cursor() as (conn, cursor):
        try:
            # ❗ Solo elimina si el ID del comentario y el ID del usuario coinciden
            await cursor.execute("""
                DELETE FROM comentarios 
                WHERE id = %s AND usuario_id = %s
            """, (comment_id, usuario_id))
            
            # rowcount > 0 indica que se eliminó al menos una fila
            if cursor.rowcount > 0:
                await conn.commit()
                return True
            return False
            
        except Exception as e:
            print(f"❌ Error DB al eliminar comentario: {e}")
            await conn.rollback()
            return False