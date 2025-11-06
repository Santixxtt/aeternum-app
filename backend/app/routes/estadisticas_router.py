from fastapi import APIRouter, Depends, HTTPException
from app.models.estadisticas_model import (
    obtener_estadisticas_bibliotecario,
    obtener_prestamos_recientes,
    obtener_alertas_bibliotecario,
    obtener_datos_grafica_prestamos,
    obtener_libros_populares
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/estadisticas", tags=["Estadísticas"])


def verificar_bibliotecario(current_user: dict):
    """Verifica que el usuario sea bibliotecario"""
    rol = current_user.get("rol") or current_user.get("role")
    if rol != "bibliotecario":
        raise HTTPException(status_code=403, detail="Acceso restringido a bibliotecarios")


@router.get("/bibliotecario/generales")
async def estadisticas_generales_bibliotecario(
    current_user: dict = Depends(get_current_user)
):
    """Obtiene estadísticas generales para el dashboard del bibliotecario"""
    verificar_bibliotecario(current_user)
    
    resultado = await obtener_estadisticas_bibliotecario()
    
    if resultado.get("status") == "success":
        return resultado
    
    raise HTTPException(status_code=400, detail=resultado.get("message"))


@router.get("/bibliotecario/prestamos-recientes")
async def prestamos_recientes(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene los préstamos más recientes"""
    verificar_bibliotecario(current_user)
    
    resultado = await obtener_prestamos_recientes(limit)
    
    if resultado.get("status") == "success":
        return resultado
    
    raise HTTPException(status_code=400, detail=resultado.get("message"))


@router.get("/bibliotecario/alertas")
async def alertas_bibliotecario(
    current_user: dict = Depends(get_current_user)
):
    """Obtiene alertas de préstamos atrasados y por vencer"""
    verificar_bibliotecario(current_user)
    
    resultado = await obtener_alertas_bibliotecario()
    
    if resultado.get("status") == "success":
        return resultado
    
    raise HTTPException(status_code=400, detail=resultado.get("message"))


@router.get("/bibliotecario/grafica-prestamos")
async def grafica_prestamos(
    current_user: dict = Depends(get_current_user)
):
    """Obtiene datos para gráfica de préstamos por mes"""
    verificar_bibliotecario(current_user)
    
    resultado = await obtener_datos_grafica_prestamos()
    
    if resultado.get("status") == "success":
        return resultado
    
    raise HTTPException(status_code=400, detail=resultado.get("message"))

@router.get("/bibliotecario/libros-populares")
async def libros_populares(
    tipo: str = "prestamos",  # valores: prestamos | wishlist
    current_user: dict = Depends(get_current_user)
):
    """Obtiene los libros más prestados o más guardados en wishlist"""
    verificar_bibliotecario(current_user)

    resultado = await obtener_libros_populares(tipo)
    if resultado.get("status") == "success":
        return resultado

    raise HTTPException(status_code=400, detail=resultado.get("message"))