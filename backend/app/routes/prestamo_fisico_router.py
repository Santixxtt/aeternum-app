from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import pytz

from app.models.prestamo_fisico_model import (
    crear_prestamo_fisico, 
    obtener_prestamos_usuario, 
    cancelar_prestamo_fisico, 
    actualizar_estado_prestamo
)
from app.schemas.prestamos_schema import PrestamoFisicoRequest, EstadoRequest
from app.utils.security import get_current_user
from app.config.database import get_cursor
from app.dependencias.redis import r
from app.utils.email_prestamos import send_prestamo_cancelado_bibliotecario 

router = APIRouter(prefix="/prestamos-fisicos", tags=["Préstamos Físicos"])

def limpiar_cache_prestamos(usuario_id: int = None, prestamo_id: int = None):
    """Limpia cachés de préstamos de forma eficiente"""
    try:
        if prestamo_id:
            r.delete(f"prestamo:{prestamo_id}")
        
        if usuario_id:
            r.delete(f"prestamos_fisicos_usuario:{usuario_id}")
        
        # Limpiar estadísticas globales
        r.delete("estadisticas:bibliotecario")
        r.delete("prestamos:recientes")
        
        # Limpiar gráficas
        pattern = "grafica_prestamos:*"
        for key in r.scan_iter(pattern):
            r.delete(key)
    except Exception as e:
        print(f"⚠️ Error limpiando caché: {e}")

@router.get("/puede-solicitar")
async def puede_solicitar_prestamo(current_user: dict = Depends(get_current_user)):
    """Verifica si el usuario puede solicitar un nuevo préstamo físico (límite: 2)"""
    usuario_id = current_user.get("sub")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")
    
    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT COUNT(*) as total
            FROM prestamos_fisicos
            WHERE usuario_id = %s 
            AND estado IN ('pendiente', 'activo')
        """, (int(usuario_id),))
        
        result = await cursor.fetchone()
        prestamos_activos = result['total'] if result else 0
        
        puede_solicitar = prestamos_activos < 2
        
        return {
            "puede_solicitar": puede_solicitar,
            "prestamos_activos": prestamos_activos,
            "limite": 2,
            "message": "OK" if puede_solicitar else "Has alcanzado el límite de 2 préstamos activos"
        }

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
        tz = pytz.timezone("America/Bogota")
        hoy = datetime.now(tz).date()

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
        # 🧹 Limpiar TODOS los cachés relacionados inmediatamente
        limpiar_cache_prestamos(usuario_id=int(usuario_id))
        
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

    resultado = await obtener_prestamos_usuario(int(usuario_id))

    if resultado.get("status") == "success":
        return resultado

    raise HTTPException(status_code=400, detail=resultado.get("message"))


@router.put("/cancelar/{prestamo_id}")
async def cancelar_prestamo(prestamo_id: int, current_user: dict = Depends(get_current_user)):
    usuario_id = current_user.get("sub")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    resultado = await cancelar_prestamo_fisico(prestamo_id=prestamo_id, usuario_id=int(usuario_id))

    if resultado.get("status") == "success":
        # 🧹 Limpiar cachés relacionados
        limpiar_cache_prestamos(usuario_id=int(usuario_id), prestamo_id=prestamo_id)
        
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

    # ✅ Obtener datos del préstamo ANTES de actualizar (para enviar correo)
    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                pf.id,
                pf.usuario_id,
                pf.libro_id,
                u.nombre,
                u.apellido,
                u.correo,
                l.titulo
            FROM prestamos_fisicos pf
            INNER JOIN usuarios u ON pf.usuario_id = u.id
            INNER JOIN libros l ON pf.libro_id = l.id
            WHERE pf.id = %s
        """, (prestamo_id,))
        
        prestamo_info = await cursor.fetchone()
    
    if not prestamo_info:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")

    # ✅ Actualizar estado del préstamo
    resultado = await actualizar_estado_prestamo(prestamo_id, data.estado)

    if resultado.get("status") == "success":
        # ✅ Limpiar todos los cachés relacionados
        r.delete(f"prestamo:{prestamo_id}")
        
        # Limpiar cachés de estadísticas
        pattern = "prestamos_fisicos_usuario:*"
        for key in r.scan_iter(pattern):
            r.delete(key)

        # ✅ Enviar correo si el bibliotecario CANCELA el préstamo
        if data.estado.lower() == "cancelado":
            try:
                nombre_completo = f"{prestamo_info['nombre']} {prestamo_info['apellido']}"
                
                # Enviar correo de cancelación (no esperar, ejecutar en background)
                await send_prestamo_cancelado_bibliotecario(
                    recipient_email=prestamo_info['correo'],
                    nombre_usuario=nombre_completo,
                    titulo_libro=prestamo_info['titulo']
                )
                
                print(f"✅ Correo de cancelación enviado a {prestamo_info['correo']}")
                
            except Exception as e:
                # No fallar la operación si el correo falla
                print(f"⚠️ Error al enviar correo de cancelación: {e}")

        return resultado

    raise HTTPException(status_code=400, detail=resultado.get("message"))
