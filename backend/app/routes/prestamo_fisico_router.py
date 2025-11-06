from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.models.prestamo_fisico_model import (
    crear_prestamo_fisico, 
    obtener_prestamos_usuario, 
    cancelar_prestamo_fisico, 
    actualizar_estado_prestamo
)
from app.schemas.prestamos_schema import PrestamoFisicoRequest, EstadoRequest
from app.utils.security import get_current_user
from app.dependencias.redis import r  

router = APIRouter(prefix="/prestamos-fisicos", tags=["Préstamos Físicos"])

@router.post("/solicitar")
async def solicitar_prestamo_fisico(
    data: PrestamoFisicoRequest,
    current_user: dict = Depends(get_current_user)
):
    usuario_id = current_user.get("sub")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")
    
    # ✅ Validación fecha
    try:
        fecha_recogida_obj = datetime.strptime(data.fecha_recogida, "%Y-%m-%d")
        hoy = datetime.now().date()

        if fecha_recogida_obj.date() < hoy:
            raise HTTPException(status_code=400, detail="La fecha debe ser hoy o futura")

        if fecha_recogida_obj.date() > hoy + timedelta(days=30):
            raise HTTPException(status_code=400, detail="Máximo 30 días a futuro")

    except ValueError:
        raise HTTPException(status_code=400, detail="Formato inválido (YYYY-MM-DD)")

    resultado = await crear_prestamo_fisico(
        usuario_id=int(usuario_id),
        libro_id=data.libro_id,
        fecha_recogida=data.fecha_recogida
    )

    if resultado.get("status") == "success":
        cache_key = f"prestamos_fisicos_usuario:{usuario_id}"
        r.delete(cache_key)  # ❌ Limpiar caché para que recargue la lista

        return {
            "status": "success",
            "message": "📚 Préstamo físico solicitado exitosamente",
            "data": resultado
        }

    raise HTTPException(status_code=400, detail=resultado.get("message"))


@router.get("/mis-prestamos")
async def mis_prestamos_fisicos(current_user: dict = Depends(get_current_user)):
    usuario_id = current_user.get("sub")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    cache_key = f"prestamos_fisicos_usuario:{usuario_id}"

    # ✅ Intentar leer de Redis
    cache = r.get(cache_key)
    if cache:
        try:
            return {"status": "success", "prestamos": eval(cache)}
        except:
            pass  # Si algo falla, vamos a BD y reescribimos cache

    # ❌ No cache → buscar BD
    resultado = await obtener_prestamos_usuario(int(usuario_id))

    if resultado.get("status") == "success":
        r.setex(cache_key, 300, str(resultado["prestamos"]))  # ✅ 5 min cache
        return resultado

    raise HTTPException(status_code=400, detail=resultado.get("message"))


@router.put("/cancelar/{prestamo_id}")
async def cancelar_prestamo(prestamo_id: int, current_user: dict = Depends(get_current_user)):
    usuario_id = current_user.get("sub")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    resultado = await cancelar_prestamo_fisico(prestamo_id=prestamo_id, usuario_id=int(usuario_id))

    if resultado.get("status") == "success":
        r.delete(f"prestamo:{prestamo_id}")
        r.delete(f"prestamos_fisicos_usuario:{usuario_id}")  # ✅ limpiar cache del usuario
        return {"status": "success", "message": resultado.get("message")}

    raise HTTPException(status_code=400, detail=resultado.get("message"))


@router.put("/estado/{prestamo_id}")
async def cambiar_estado_prestamo(
    prestamo_id: int, 
    data: EstadoRequest, 
    current_user: dict = Depends(get_current_user)
):
    usuario_id = current_user.get("sub")
    rol = current_user.get("rol") or current_user.get("role")

    if not usuario_id:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    if rol != "bibliotecario":
        raise HTTPException(status_code=403, detail="Acceso restringido")

    resultado = await actualizar_estado_prestamo(prestamo_id, data.estado)

    if resultado.get("status") == "success":
        r.delete(f"prestamo:{prestamo_id}")  # borrar cache del prestamo si existiera

        return resultado

    raise HTTPException(status_code=400, detail=resultado.get("message"))
