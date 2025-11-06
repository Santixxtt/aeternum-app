from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional, Dict, Any
from app.models.user_model import (
    get_user_by_id,
    update_user_by_id,
    deactivate_user_by_id,
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_current_user_data(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
    
    user = await get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    return {
        "id": user["id"],
        "nombre": user["nombre"],
        "apellido": user["apellido"],
        "correo": user["correo"],
        "email": user["correo"],  
        "rol": user["rol"],
        "estado": user.get("estado"),
        "tipo_identificacion": user.get("tipo_identificacion"),
        "num_identificacion": user.get("num_identificacion"),
    }


@router.put("/me")
async def update_current_user(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")

    nombre = payload.get("nombre")
    apellido = payload.get("apellido")
    correo = payload.get("correo") or payload.get("email")
    tipo_identificacion = payload.get("tipo_identificacion")
    num_identificacion = payload.get("num_identificacion")

    if not nombre or not apellido or not correo:
        raise HTTPException(status_code=400, detail="Faltan campos requeridos: nombre, apellido, correo")

    # Actualizar en DB
    updated = await update_user_by_id(
        user_id=user_id,
        nombre=nombre,
        apellido=apellido,
        correo=correo,
        tipo_identificacion=tipo_identificacion,
        num_identificacion=num_identificacion
    )

    if not updated:
        raise HTTPException(status_code=500, detail="No se pudo actualizar el usuario")

    # Obtener datos actualizados
    user = await get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado después de actualizar")

    # Devolver datos completos y actualizados
    return {
        "id": user["id"],
        "nombre": user["nombre"],
        "apellido": user["apellido"],
        "correo": user["correo"],
        "email": user["correo"],
        "rol": user["rol"],
        "estado": user.get("estado"),
        "tipo_identificacion": user.get("tipo_identificacion"),
        "num_identificacion": user.get("num_identificacion"),
    }


@router.delete("/me")
async def delete_current_user(current_user: dict = Depends(get_current_user)):
    """
    'Elimina' el usuario marcando estado = 'Desactivado'
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")

    result = await deactivate_user_by_id(user_id)

    if not result:
        raise HTTPException(status_code=500, detail="No se pudo desactivar el usuario")

    return {"status": "success", "message": "Usuario desactivado correctamente"}


@router.put("/reactivar/{user_id}")
async def reactivate_user_account(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Reactiva un usuario (solo para bibliotecarios).
    """
    if current_user.get("rol") != "bibliotecario":
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    from app.models.user_model import reactivate_user_by_id, get_user_by_id

    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    if user["estado"] == "Activo":
        return {"status": "warning", "message": "El usuario ya está activo."}

    result = await reactivate_user_by_id(user_id)
    if not result:
        raise HTTPException(status_code=500, detail="No se pudo reactivar el usuario.")

    return {"status": "success", "message": "Usuario reactivado correctamente."}