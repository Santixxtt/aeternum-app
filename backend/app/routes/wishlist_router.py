from fastapi import APIRouter, HTTPException, Depends
from app.models import wishlist_model
from app.utils.security import get_current_user
from app.config.database import get_cursor
import json 
from app.dependencias.redis import r 

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

CACHE_TTL_SECONDS = 1800 # 30 minutos de caché para la lista de deseos


# 🔹 Agregar libro a la lista de deseos
@router.post("/add")
async def add_to_wishlist_route(libro: dict, current_user: dict = Depends(get_current_user)):
    usuario_id = int(current_user["sub"])
    
    print(f"📥 Recibido libro: {libro.get('titulo')}")
    print(f"📥 Género: {libro.get('genero')}, Editorial: {libro.get('editorial')}")
    
    libro_id = await wishlist_model.ensure_book_is_persisted(libro)

    if not libro_id:
        raise HTTPException(status_code=500, detail="Error al procesar el libro en el sistema.")

    added = await wishlist_model.add_to_wishlist(usuario_id, libro_id)
    if not added:
        raise HTTPException(status_code=400, detail="Este libro ya está en tu lista de deseos.")

    # ✅ Invalidar caché tras agregar
    r.delete(f"wishlist:{usuario_id}")
    print(f"🗑️ Caché invalidado para usuario {usuario_id}")

    return {"message": "Libro agregado a la lista de deseos.", "libro_id": libro_id}


# 🔹 Obtener lista de deseos del usuario autenticado
@router.get("/list")
async def get_wishlist_route(current_user: dict = Depends(get_current_user)):
    usuario_id = int(current_user["sub"])
    
    CACHE_KEY = f"wishlist:{usuario_id}"

    # ⚠️ NO USAR CACHÉ TEMPORALMENTE - Siempre consultar DB
    # cached_wishlist = r.get(CACHE_KEY)
    # if cached_wishlist:
    #     print(f"✅ Wishlist obtenida de caché para usuario {usuario_id}")
    #     return {"wishlist": json.loads(cached_wishlist.decode('utf-8'))}
    
    print(f"🔄 Obteniendo wishlist DIRECTAMENTE de DB para usuario {usuario_id}")
    
    try:
        deseos = await wishlist_model.get_wishlist(usuario_id)
        print(f"📚 Se encontraron {len(deseos)} libros en wishlist")
        
        # ✅ Guardar en caché SOLO si la query fue exitosa
        if deseos is not None:
            r.setex(CACHE_KEY, CACHE_TTL_SECONDS, json.dumps(deseos))
        
        return {"wishlist": deseos or []}
    except Exception as e:
        print(f"❌ Error al obtener wishlist: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener lista de deseos: {str(e)}")


# 🔹 Eliminar libro de la lista de deseos
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
        
        # ✅ Invalidar caché tras eliminar
        r.delete(f"wishlist:{usuario_id}")
        print(f"🗑️ Caché invalidado tras eliminar libro {book_id}")

        return {"message": "Libro eliminado correctamente"}


# 🔹 Buscar o crear libro para préstamo físico
@router.post("/ensure-book-for-loan")
async def ensure_book_for_loan_route(
    libro: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Garantiza que un libro exista en la BD para préstamos.
    Si no existe, lo crea. Devuelve libro_id y disponibilidad.
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


# 🔹 Buscar libro por openlibrary_key (para préstamos físicos)
@router.get("/buscar-libro/{openlibrary_key}")
async def buscar_libro_por_key(
    openlibrary_key: str, 
    current_user: dict = Depends(get_current_user)
):
    """
    Busca un libro en la base de datos por su openlibrary_key.
    Si no existe, devuelve 404 para que el frontend lo cree.
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
                    cover_id
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
                    "cover_id": libro["cover_id"]
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