from fastapi import APIRouter, Query
from app.config.database import get_cursor
from typing import List, Dict, Any
import httpx

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/books")
async def search_books_hybrid(
    q: str = Query(..., min_length=3, description="Término de búsqueda"),
    limit: int = Query(20, ge=1, le=100, description="Límite de resultados")
):
    """
    Búsqueda híbrida: Primero busca en libros locales, luego en OpenLibrary.
    Los libros locales aparecen primero y están marcados con 'es_local: true'
    """
    
    resultados_locales = []
    resultados_openlibrary = []
    
    # 1️⃣ Buscar en base de datos local
    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                l.id,
                l.titulo,
                l.openlibrary_key,
                l.cover_id,
                l.imagen_local,
                l.fecha_publicacion,
                l.descripcion,
                l.cantidad_disponible,
                l.estado,
                a.nombre AS autor_nombre,
                e.nombre AS editorial_nombre,
                g.nombre AS genero_nombre
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            LEFT JOIN generos g ON l.genero_id = g.id
            WHERE l.estado = 'Activo'
            AND (
                l.titulo LIKE %s 
                OR a.nombre LIKE %s 
                OR e.nombre LIKE %s 
                OR g.nombre LIKE %s
            )
            LIMIT %s
        """, (f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%", limit))
        
        libros_locales = await cursor.fetchall()

    for libro in libros_locales:
        resultado = {
            "key": libro["openlibrary_key"] or f"/works/LOCAL_{libro['id']}",
            "title": libro["titulo"],
            "author_name": [libro["autor_nombre"]] if libro["autor_nombre"] else ["Desconocido"],
            "cover_i": libro["cover_id"],
            "first_publish_year": int(str(libro["fecha_publicacion"])[:4]) if libro["fecha_publicacion"] else None,
            "editorial": libro["editorial_nombre"],
            "genero": libro["genero_nombre"],
            "cantidad_disponible": libro["cantidad_disponible"],
            
            "es_local": True,
            "libro_id": libro["id"],
            "imagen_local": libro["imagen_local"],
            "descripcion_local": libro["descripcion"],
            "estado": libro["estado"]
        }
        resultados_locales.append(resultado)
    
    libros_restantes = limit - len(resultados_locales)
    
    if libros_restantes > 0:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://openlibrary.org/search.json",
                    params={"q": q, "limit": libros_restantes}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    libros_openlibrary = data.get("docs", [])
                    
                    # Marcar libros de OpenLibrary
                    for libro in libros_openlibrary:
                        libro["es_local"] = False
                    
                    resultados_openlibrary = libros_openlibrary
        
        except Exception as e:
            print(f"⚠️ Error al buscar en OpenLibrary: {e}")
    
    # Combinar resultados: Locales primero, luego OpenLibrary
    resultados_combinados = resultados_locales + resultados_openlibrary
    
    return {
        "total_local": len(resultados_locales),
        "total_openlibrary": len(resultados_openlibrary),
        "total": len(resultados_combinados),
        "docs": resultados_combinados
    }


@router.get("/books/local-only")
async def get_local_books(
    limit: int = Query(12, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Obtiene solo libros locales (para recomendaciones mezcladas con OpenLibrary)
    """
    
    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                l.id,
                l.titulo,
                l.openlibrary_key,
                l.cover_id,
                l.imagen_local,
                l.fecha_publicacion,
                l.descripcion,
                l.cantidad_disponible,
                a.nombre AS autor_nombre,
                e.nombre AS editorial_nombre,
                g.nombre AS genero_nombre
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            LEFT JOIN generos g ON l.genero_id = g.id
            WHERE l.estado = 'Activo'
            ORDER BY l.id DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        
        libros = await cursor.fetchall()
    
    resultados = []
    for libro in libros:
        resultado = {
            "key": libro["openlibrary_key"] or f"/works/LOCAL_{libro['id']}",
            "title": libro["titulo"],
            "author_name": [libro["autor_nombre"]] if libro["autor_nombre"] else ["Desconocido"],
            "cover_i": libro["cover_id"],
            "first_publish_year": int(str(libro["fecha_publicacion"])[:4]) if libro["fecha_publicacion"] else None,
            "es_local": True,
            "libro_id": libro["id"],
            "imagen_local": libro["imagen_local"],
            "descripcion_local": libro["descripcion"]
        }
        resultados.append(resultado)
    
    return {
        "total": len(resultados),
        "docs": resultados
    }