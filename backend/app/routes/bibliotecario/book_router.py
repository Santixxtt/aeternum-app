from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Any, Dict, Optional, List
from app.utils.security import get_current_user
from app.config.database import get_cursor

router = APIRouter(prefix="/admin/books", tags=["Admin - Books"])


# 🧩 Middleware de permisos (solo bibliotecarios)
def verify_librarian_role(current_user: dict):
    if current_user.get("rol") != "bibliotecario":
        raise HTTPException(
            status_code=403, 
            detail="Acceso denegado: se requiere rol de bibliotecario."
        )


# 📋 Obtener todos los libros
@router.get("/")
async def get_all_books(current_user: dict = Depends(get_current_user)):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                l.id, 
                l.titulo, 
                l.descripcion, 
                l.autor_id, 
                l.editorial_id, 
                l.genero_id, 
                l.fecha_publicacion, 
                l.cantidad_disponible, 
                l.estado, 
                l.openlibrary_key, 
                l.cover_id,
                a.nombre AS autor_nombre,
                e.nombre AS editorial_nombre,
                g.nombre AS genero_nombre
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            LEFT JOIN generos g ON l.genero_id = g.id
            ORDER BY l.id DESC
        """)
        books = await cursor.fetchall()

    return {"total": len(books), "libros": books}


# 🔍 Obtener un libro por ID
@router.get("/{book_id}")
async def get_book_by_id(
    book_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                l.*,
                a.nombre AS autor_nombre,
                e.nombre AS editorial_nombre,
                g.nombre AS genero_nombre
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            LEFT JOIN generos g ON l.genero_id = g.id
            WHERE l.id = %s
        """, (book_id,))
        book = await cursor.fetchone()

    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado.")
    
    return book


# ➕ Crear un nuevo libro
@router.post("/")
async def create_book(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    titulo = payload.get("titulo")
    descripcion = payload.get("descripcion", "")
    autor_id = payload.get("autor_id")
    editorial_id = payload.get("editorial_id")
    genero_id = payload.get("genero_id")
    fecha_publicacion = payload.get("fecha_publicacion")
    cantidad_disponible = payload.get("cantidad_disponible", 1)
    openlibrary_key = payload.get("openlibrary_key", "")
    cover_id = payload.get("cover_id", 0)

    if not titulo or not autor_id or not editorial_id or not genero_id:
        raise HTTPException(
            status_code=400, 
            detail="Faltan campos requeridos: titulo, autor_id, editorial_id, genero_id"
        )

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            INSERT INTO libros (
                titulo, descripcion, autor_id, editorial_id, genero_id, 
                fecha_publicacion, cantidad_disponible, openlibrary_key, cover_id, estado
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'Activo')
        """, (
            titulo, descripcion, autor_id, editorial_id, genero_id,
            fecha_publicacion, cantidad_disponible, openlibrary_key, cover_id
        ))
        await conn.commit()
        libro_id = cursor.lastrowid

    return {
        "status": "success",
        "message": "Libro creado correctamente",
        "libro_id": libro_id
    }


# ✏️ Actualizar un libro
@router.put("/{book_id}")
async def update_book(
    book_id: int,
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    titulo = payload.get("titulo")
    descripcion = payload.get("descripcion", "")
    autor_id = payload.get("autor_id")
    editorial_id = payload.get("editorial_id")
    genero_id = payload.get("genero_id")
    fecha_publicacion = payload.get("fecha_publicacion")
    cantidad_disponible = payload.get("cantidad_disponible", 1)
    openlibrary_key = payload.get("openlibrary_key", "")
    cover_id = payload.get("cover_id", 0)

    if not titulo or not autor_id or not editorial_id or not genero_id:
        raise HTTPException(
            status_code=400, 
            detail="Faltan campos requeridos"
        )

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            UPDATE libros 
            SET titulo = %s, descripcion = %s, autor_id = %s, editorial_id = %s, 
                genero_id = %s, fecha_publicacion = %s, cantidad_disponible = %s,
                openlibrary_key = %s, cover_id = %s
            WHERE id = %s
        """, (
            titulo, descripcion, autor_id, editorial_id, genero_id,
            fecha_publicacion, cantidad_disponible, openlibrary_key, 
            cover_id, book_id
        ))
        await conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404, 
                detail="Libro no encontrado"
            )

    return {"status": "success", "message": "Libro actualizado correctamente"}


# 🚫 Desactivar un libro
@router.put("/desactivar/{book_id}")
async def deactivate_book(
    book_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute(
            "UPDATE libros SET estado = 'Desactivado' WHERE id = %s", 
            (book_id,)
        )
        await conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404, 
                detail="Libro no encontrado"
            )

    return {
        "status": "success", 
        "message": f"Libro {book_id} desactivado correctamente."
    }


# ✅ Activar un libro
@router.put("/activar/{book_id}")
async def activate_book(
    book_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute(
            "UPDATE libros SET estado = 'Activo' WHERE id = %s", 
            (book_id,)
        )
        await conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404, 
                detail="Libro no encontrado"
            )

    return {
        "status": "success", 
        "message": f"Libro {book_id} activado correctamente."
    }