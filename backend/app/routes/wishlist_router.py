from fastapi import APIRouter, HTTPException, Depends
from app.models import wishlist_model
from app.utils.security import get_current_user
from app.config.database import get_cursor
from app.dependencias.redis import r 
import json 
from datetime import datetime
from decimal import Decimal

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

CACHE_TTL_SECONDS = 1800  # 30 minutos


@router.post("/add")
async def add_to_wishlist_route(libro: dict, current_user: dict = Depends(get_current_user)):
    usuario_id = int(current_user["sub"])
    
    print(f"📥 Recibido libro: {libro.get('titulo')}")
    
    libro_id = await wishlist_model.ensure_book_is_persisted(libro)

    if not libro_id:
        raise HTTPException(status_code=500, detail="Error al procesar el libro en el sistema.")

    added = await wishlist_model.add_to_wishlist(usuario_id, libro_id)
    if not added:
        raise HTTPException(status_code=400, detail="Este libro ya está en tu lista de deseos.")

    r.delete(f"wishlist:{usuario_id}")
    print(f"🗑️ Caché invalidado para usuario {usuario_id}")

    return {"message": "Libro agregado a la lista de deseos.", "libro_id": libro_id}


@router.get("/list")
async def get_wishlist_route(current_user: dict = Depends(get_current_user)):
    usuario_id = int(current_user["sub"])
    CACHE_KEY = f"wishlist:{usuario_id}"
    print(f"🔄 Obteniendo wishlist para usuario {usuario_id}")

    # ✅ LEER CACHÉ PRIMERO
    cached = r.get(CACHE_KEY)
    if cached:
        try:
            print(f"⚡ Cache hit para usuario {usuario_id}")
            return {"wishlist": json.loads(cached)}
        except json.JSONDecodeError:
            print(f"⚠️ Caché corrupto, regenerando...")
            r.delete(CACHE_KEY)

    try:
        async with get_cursor() as (conn, cursor):
            await cursor.execute("""
                SELECT 
                    l.id,
                    l.titulo,
                    l.descripcion,
                    l.openlibrary_key,
                    l.cover_id,
                    l.imagen_local,
                    l.cantidad_disponible,
                    l.estado,
                    a.nombre AS autor,
                    e.nombre AS editorial,
                    g.nombre AS genero,
                    ld.fecha_agregado
                FROM lista_deseos ld
                JOIN libros l ON ld.libro_id = l.id
                LEFT JOIN autores a ON l.autor_id = a.id
                LEFT JOIN editoriales e ON l.editorial_id = e.id
                LEFT JOIN generos g ON l.genero_id = g.id
                WHERE ld.usuario_id = %s
                ORDER BY ld.fecha_agregado DESC  -- ✅ Más recientes primero
            """, (usuario_id,))
            deseos = await cursor.fetchall()

        # 🧹 Limpieza de datos para serializar
        clean_deseos = []
        for d in deseos:
            clean_deseos.append({
                k: (
                    v.isoformat() if isinstance(v, datetime)
                    else float(v) if isinstance(v, Decimal)
                    else v
                )
                for k, v in d.items()
            })

        print(f"📚 Se encontraron {len(clean_deseos)} libros en wishlist")

        # ✅ GUARDAR EN CACHÉ
        if clean_deseos:
            r.setex(CACHE_KEY, CACHE_TTL_SECONDS, json.dumps(clean_deseos))

        return {"wishlist": clean_deseos}

    except Exception as e:
        print(f"❌ Error al obtener wishlist: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener lista de deseos: {str(e)}")
    
@router.delete("/delete/{book_id}")
async def delete_from_wishlist(book_id: int, current_user: dict = Depends(get_current_user)):
    usuario_id = int(current_user["sub"])

    async with get_cursor() as (conn, cursor):
        await cursor.execute(
            "DELETE FROM lista_deseos WHERE libro_id = %s AND usuario_id = %s",
            (book_id, usuario_id)
        )
        await conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Libro no encontrado en la lista de deseos")
        
        r.delete(f"wishlist:{usuario_id}")
        print(f"🗑️ Caché invalidado tras eliminar libro {book_id}")

        return {"message": "Libro eliminado correctamente"}


@router.post("/ensure-book-for-loan")
async def ensure_book_for_loan_route(
    libro: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Garantiza que un libro exista en la BD para préstamos.
    Ahora soporta imagen_local para libros creados manualmente.
    """
    result = await wishlist_model.ensure_book_for_loan(libro)
    
    if not result:
        raise HTTPException(
            status_code=500, 
            detail="Error al procesar el libro en el sistema"
        )
    
    return {
        "status": "success",
        "libro_id": result["libro_id"],
        "cantidad_disponible": result["cantidad_disponible"]
    }


@router.get("/buscar-libro/{openlibrary_key}")
async def buscar_libro_por_key(
    openlibrary_key: str, 
    current_user: dict = Depends(get_current_user)
):
    """
    Busca un libro por su openlibrary_key.
    Incluye imagen_local en la respuesta.
    """
    normalized_key = wishlist_model.normalize_ol_key(openlibrary_key)
    
    CACHE_KEY = f"book_ol_key:{normalized_key}"
    
    cached_book = r.get(CACHE_KEY)
    if cached_book:
        return json.loads(cached_book.decode('utf-8'))

    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT 
                    id,
                    titulo,
                    autor_id,
                    cantidad_disponible,
                    openlibrary_key,
                    cover_id,
                    imagen_local
                FROM libros
                WHERE openlibrary_key = %s
            """, (normalized_key,))
            
            libro = await cursor.fetchone()
            
            if not libro:
                raise HTTPException(
                    status_code=404, 
                    detail="Libro no encontrado en la biblioteca"
                )
            
            response_data = {
                "status": "success",
                "libro_id": libro["id"],
                "libro": {
                    "id": libro["id"],
                    "titulo": libro["titulo"],
                    "cantidad_disponible": libro["cantidad_disponible"] or 0,
                    "openlibrary_key": libro["openlibrary_key"],
                    "cover_id": libro["cover_id"],
                    "imagen_local": libro["imagen_local"]
                }
            }
            
            r.setex(CACHE_KEY, 3600, json.dumps(response_data))
            
            return response_data
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al buscar libro: {str(e)}"
            )