from datetime import datetime
from fastapi import HTTPException
from app.config.database import get_cursor
from app.models.wishlist_model import (
    split_autor_name,
    get_or_create_autor,
    ensure_book_is_persisted,
)


async def registrar_prestamo(usuario_id: int, libro_data: dict):
    """
    Registra un préstamo digital con un solo clic.
    Usa las funciones de wishlist_model para no duplicar código.
    """
    if not all(k in libro_data for k in ("openlibrary_key", "titulo", "autor")):
        raise HTTPException(status_code=400, detail="Datos incompletos")

    # 1️⃣ Asegurar que el libro y autor existan
    libro_id = await ensure_book_is_persisted(libro_data)
    if not libro_id:
        raise HTTPException(status_code=500, detail="Error al crear o encontrar el libro")

    nombre, apellido = split_autor_name(libro_data["autor"])
    autor_id = await get_or_create_autor(nombre, apellido)

    # 2️⃣ Registrar el préstamo
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute(
                """
                INSERT INTO prestamos (usuario_id, libro_id, titulo, autor_id, fecha_prestamo)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (usuario_id, libro_id, libro_data["titulo"], autor_id, datetime.now())
            )
            await conn.commit()
            return {"status": "success", "message": "Préstamo registrado con éxito"}

        except Exception as e:
            await conn.rollback()
            print(f"❌ Error al registrar préstamo: {e}")
            raise HTTPException(status_code=500, detail="Error interno al registrar préstamo")


async def obtener_todos_prestamos_digitales():
    """Obtiene todos los préstamos digitales con info del usuario"""
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT 
                    p.id,
                    p.usuario_id,
                    p.libro_id,
                    p.titulo,
                    p.fecha_prestamo,
                    u.nombre as usuario_nombre,
                    u.apellido as usuario_apellido,
                    u.correo as usuario_correo,
                    a.nombre as autor_nombre,
                    a.apellido as autor_apellido,
                    l.openlibrary_key
                FROM prestamos p
                JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN autores a ON p.autor_id = a.id
                LEFT JOIN libros l ON p.libro_id = l.id
                ORDER BY p.fecha_prestamo DESC
            """)

            prestamos = await cursor.fetchall()
            return {"status": "success", "prestamos": prestamos}

        except Exception as e:
            print(f"❌ Error obtener_todos_prestamos_digitales: {e}")
            return {"status": "error", "message": str(e)}


async def obtener_libros_digitales_populares(limit: int = 10):
    """Obtiene los libros digitales más prestados"""
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT 
                    p.titulo,
                    CONCAT(a.nombre, ' ', a.apellido) as autor,
                    l.openlibrary_key,
                    COUNT(*) as total_prestamos
                FROM prestamos p
                LEFT JOIN autores a ON p.autor_id = a.id
                LEFT JOIN libros l ON p.libro_id = l.id
                GROUP BY p.titulo, a.nombre, a.apellido, l.openlibrary_key
                ORDER BY total_prestamos DESC
                LIMIT %s
            """, (limit,))

            libros = await cursor.fetchall()
            return {"status": "success", "libros": libros}

        except Exception as e:
            print(f"❌ Error obtener_libros_digitales_populares: {e}")
            return {"status": "error", "message": str(e)}