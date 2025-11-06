from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Any, Dict, Optional, List
from app.utils.security import get_current_user
from app.models.user_model import (
    get_user_by_id,
    update_user_by_id,
    deactivate_user_by_id,
    reactivate_user_by_id,
)
from app.config.database import get_cursor

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


# 🧩 Middleware de permisos (solo bibliotecarios)
def verify_librarian_role(current_user: dict):
    if current_user.get("rol") != "bibliotecario":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol de bibliotecario.")


# 📋 Obtener todos los usuarios
@router.get("/")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT id, nombre, apellido, correo, rol, estado, tipo_identificacion, num_identificacion
            FROM usuarios
            ORDER BY id DESC
        """)
        users = await cursor.fetchall()

    return {"total": len(users), "usuarios": users}


# 🔍 Obtener un usuario por ID
@router.get("/{user_id}")
async def get_user_by_admin(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return user


# ✏️ Actualizar cualquier usuario
@router.put("/{user_id}")
async def update_user_by_admin(
    user_id: int,
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    nombre = payload.get("nombre")
    apellido = payload.get("apellido")
    correo = payload.get("correo") or payload.get("email")
    tipo_identificacion = payload.get("tipo_identificacion")
    num_identificacion = payload.get("num_identificacion")

    if not nombre or not apellido or not correo:
        raise HTTPException(status_code=400, detail="Faltan campos requeridos: nombre, apellido y correo")

    updated = await update_user_by_id(
        user_id=user_id,
        nombre=nombre,
        apellido=apellido,
        correo=correo,
        tipo_identificacion=tipo_identificacion,
        num_identificacion=num_identificacion
    )

    if not updated:
        raise HTTPException(status_code=500, detail="No se pudo actualizar el usuario.")

    user = await get_user_by_id(user_id)
    return {"status": "success", "usuario": user}


# 🚫 Desactivar un usuario
@router.put("/desactivar/{user_id}")
async def deactivate_user_by_admin(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    result = await deactivate_user_by_id(user_id)
    if not result:
        raise HTTPException(status_code=500, detail="No se pudo desactivar el usuario.")

    return {"status": "success", "message": f"Usuario {user_id} desactivado correctamente."}


# ✅ Reactivar un usuario
@router.put("/reactivar/{user_id}")
async def reactivate_user_by_admin(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    if user["estado"] == "Activo":
        return {"status": "warning", "message": "El usuario ya está activo."}

    result = await reactivate_user_by_id(user_id)
    if not result:
        raise HTTPException(status_code=500, detail="No se pudo reactivar el usuario.")

    return {"status": "success", "message": f"Usuario {user_id} reactivado correctamente."}