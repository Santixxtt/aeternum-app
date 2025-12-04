from fastapi import APIRouter, Depends, HTTPException
from app.models.prestamo_model import (
    registrar_prestamo,
    obtener_todos_prestamos_digitales,
    obtener_libros_digitales_populares
)
from app.utils.security import get_current_user
from app.dependencias.redis import r

router = APIRouter(prefix="/prestamos", tags=["Préstamos"])


def invalidate_user_loans_cache(user_id: int):
    """Invalida el cache de préstamos del usuario"""
    r.delete(f"user_loans:{user_id}")


def verificar_bibliotecario(current_user: dict):
    """Verifica que el usuario sea bibliotecario"""
    rol = current_user.get("rol") or current_user.get("role")
    if rol != "bibliotecario":
        raise HTTPException(
            status_code=403,
            detail="Acceso restringido a bibliotecarios"
        )


# 📚 Registrar préstamo digital (Usuario)
@router.post("/digital")
async def registrar_prestamo_route(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    usuario_id = current_user.get("sub")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    try:
        resultado = await registrar_prestamo(usuario_id, data)

        if resultado.get("status") != "success":
            return {
                "status": "error",
                "message": "⚠️ No se pudo registrar el préstamo.",
                "detalles": resultado
            }

        # ❇️ Invalida cache para que el préstamo aparezca sin recargar
        invalidate_user_loans_cache(usuario_id)

        return {
            "status": "success",
            "message": "Préstamo digital registrado correctamente.",
            "libro": {
                "titulo": data.get("titulo"),
                "autor": data.get("autor"),
                "openlibrary_key": data.get("openlibrary_key"),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error inesperado en préstamo digital: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


#  Obtener todos los préstamos digitales (Bibliotecario)
@router.get("/all-digital")
async def obtener_prestamos_digitales(
    current_user: dict = Depends(get_current_user)
):
    verificar_bibliotecario(current_user)
    
    resultado = await obtener_todos_prestamos_digitales()
    
    if resultado.get("status") == "success":
        return resultado
    
    raise HTTPException(
        status_code=400,
        detail=resultado.get("message", "Error al obtener préstamos")
    )


# 📊 Obtener libros digitales más populares (Bibliotecario)
@router.get("/digitales-populares")
async def libros_digitales_populares(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    verificar_bibliotecario(current_user)
    
    resultado = await obtener_libros_digitales_populares(limit)
    
    if resultado.get("status") == "success":
        return resultado
    
    raise HTTPException(
        status_code=400,
        detail=resultado.get("message", "Error al obtener libros populares")
    )