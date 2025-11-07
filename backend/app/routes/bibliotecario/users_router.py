from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Any, Dict
from app.utils.security import get_current_user
from app.config.database import get_cursor

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


# 🧩 Middleware de permisos (solo bibliotecarios)
def verify_librarian_role(current_user: dict):
    if current_user.get("rol") != "bibliotecario":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol de bibliotecario.")


# 📋 Obtener todos los usuarios (OPTIMIZADO)
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


# 🔍 Obtener un usuario por ID (OPTIMIZADO)
@router.get("/{user_id}")
async def get_user_by_admin(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT id, nombre, apellido, correo, rol, estado, tipo_identificacion, num_identificacion
            FROM usuarios
            WHERE id = %s
        """, (user_id,))
        user = await cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    return user


# ✏️ Actualizar cualquier usuario (OPTIMIZADO)
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

    async with get_cursor() as (conn, cursor):
        try:
            # Verificar que existe
            await cursor.execute("SELECT id FROM usuarios WHERE id = %s", (user_id,))
            if not await cursor.fetchone():
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            # Actualizar directamente
            await cursor.execute("""
                UPDATE usuarios 
                SET nombre = %s, 
                    apellido = %s, 
                    correo = %s,
                    tipo_identificacion = %s,
                    num_identificacion = %s
                WHERE id = %s
            """, (nombre, apellido, correo, tipo_identificacion, num_identificacion, user_id))
            
            await conn.commit()

            # Obtener usuario actualizado
            await cursor.execute("""
                SELECT id, nombre, apellido, correo, rol, estado, tipo_identificacion, num_identificacion
                FROM usuarios
                WHERE id = %s
            """, (user_id,))
            user = await cursor.fetchone()

            return {"status": "success", "usuario": user}

        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")


@router.put("/desactivar/{user_id}")
async def deactivate_user_by_admin(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        try:
            # Verificar que existe
            await cursor.execute("SELECT id, estado FROM usuarios WHERE id = %s", (user_id,))
            user = await cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            if user["estado"] == "Desactivado":
                return {"status": "warning", "message": "El usuario ya está desactivado"}

            # Desactivar directamente
            await cursor.execute("""
                UPDATE usuarios 
                SET estado = 'Desactivado'
                WHERE id = %s
            """, (user_id,))
            user = await cursor.fetchone()
            
            await conn.commit()

            return {"status": "success", "message": f"Usuario {user_id} desactivado correctamente"}

        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Error al desactivar: {str(e)}")


# ✅ Reactivar un usuario (OPTIMIZADO)
@router.put("/reactivar/{user_id}")
async def reactivate_user_by_admin(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        try:
            # Verificar que existe
            await cursor.execute("SELECT id, estado FROM usuarios WHERE id = %s", (user_id,))
            user = await cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            if user["estado"] == "Activo":
                return {"status": "warning", "message": "El usuario ya está activo"}

            # Reactivar directamente
            await cursor.execute("""
                UPDATE usuarios 
                SET estado = 'Activo'
                WHERE id = %s
            """, (user_id,))
            
            await conn.commit()

            return {"status": "success", "message": f"Usuario {user_id} reactivado correctamente"}

        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Error al reactivar: {str(e)}")