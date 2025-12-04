from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from typing import Any, Dict
from app.utils.security import get_current_user
from app.config.database import get_cursor
from io import BytesIO
from datetime import datetime
import asyncio

# Importaciones condicionales para evitar errores si no están instaladas
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("⚠️ pandas no instalado. Instala con: pip install pandas openpyxl")

try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False
    print("⚠️ fpdf2 no instalado. Instala con: pip install fpdf2")

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


# 🧩 Middleware de permisos (solo bibliotecarios)
def verify_librarian_role(current_user: dict):
    if current_user.get("rol") != "bibliotecario":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol de bibliotecario.")

async def clear_user_cache_async(user_id: int, include_session_invalidation: bool = False):
    """
    Limpia el caché del usuario de forma asíncrona
    
    Args:
        user_id: ID del usuario
        include_session_invalidation: Si True, también limpia la marca de sesión inválida
    """
    from app.dependencias.redis import r
    
    def _clear_cache():
        try:
            print(f"🧹 Iniciando limpieza de caché para usuario {user_id} (include_session_invalidation={include_session_invalidation})")
            
            # 🔥 Lista completa de claves posibles de caché de usuario
            keys_to_delete = [
                f"login_attempts:{user_id}",
                f"account_locked:{user_id}",
                f"prestamos_fisicos_usuario:{user_id}",
                f"user_data:{user_id}",
                f"user_estado:{user_id}",
                f"user_info:{user_id}",
                f"user_state:{user_id}",
            ]
            
            # Solo limpiar sesión inválida si se especifica (al reactivar)
            if include_session_invalidation:
                keys_to_delete.append(f"user_session_invalid:{user_id}")
                print(f"  ⚠️ Se incluirá limpieza de user_session_invalid:{user_id}")
            
            # Intentar borrar todas las claves
            deleted_count = 0
            for key in keys_to_delete:
                result = r.delete(key)
                if result:
                    deleted_count += 1
                    print(f"    ✅ Eliminada: {key}")
                
            print(f"✅ Limpieza completada: {deleted_count} claves eliminadas de {len(keys_to_delete)} intentadas")
            
            # ⚠️ IMPORTANTE: NO hacer ninguna actualización de BD aquí
            # Esta función es SOLO para Redis
            
        except Exception as e:
            print(f"❌ Error limpiando caché: {e}")
    
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _clear_cache)


# ✅ FUNCIÓN HELPER PARA MARCAR SESIÓN INVÁLIDA
async def invalidate_session_async(user_id: int):
    """Invalida la sesión del usuario de forma asíncrona"""
    from app.dependencias.redis import r
    
    def _invalidate():
        try:
            r.setex(f"user_session_invalid:{user_id}", 3600, "1")
        except Exception as e:
            print(f"⚠️ Error invalidando sesión: {e}")
    
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _invalidate)


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

@router.post("/")  
async def create_user_by_admin(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)
    
    # Validar campos requeridos
    nombre = payload.get("nombre")
    apellido = payload.get("apellido")
    correo = payload.get("correo")
    clave = payload.get("clave")
    rol = payload.get("rol", "usuario")
    tipo_identificacion = payload.get("tipo_identificacion")
    num_identificacion = payload.get("num_identificacion")
    
    if not all([nombre, apellido, correo, clave]):
        raise HTTPException(
            status_code=400,
            detail="Faltan campos requeridos: nombre, apellido, correo, clave"
        )
    
    # Verificar duplicados
    from app.models import user_model
    if await user_model.email_exists(correo):
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    if num_identificacion and await user_model.id_exists(num_identificacion):
        raise HTTPException(status_code=400, detail="El número de identificación ya está registrado")
    
    # Hash de contraseña
    from app.utils.security import hash_password
    hashed = hash_password(clave)
    
    # Crear usuario directamente como ACTIVO (sin verificación)
    user_id = await user_model.create_user({
        "nombre": nombre,
        "apellido": apellido,
        "tipo_identificacion": tipo_identificacion,
        "num_identificacion": num_identificacion,
        "correo": correo,
        "clave": hashed,
        "rol": rol,
        "estado": "Activo"  # ← DIRECTAMENTE ACTIVO
    })
    
    # Obtener usuario creado
    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT id, nombre, apellido, correo, rol, estado, tipo_identificacion, num_identificacion
            FROM usuarios
            WHERE id = %s
        """, (user_id,))
        user = await cursor.fetchone()
    
    return {
        "status": "success",
        "message": "Usuario creado correctamente. Puede iniciar sesión inmediatamente.",
        "usuario": user
    }


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

            # 🔥 Limpiar caché de forma asíncrona
            await clear_user_cache_async(user_id)

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
            await cursor.execute("SELECT id, estado FROM usuarios WHERE id = %s", (user_id,))
            user = await cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            if user["estado"] == "Desactivado":
                return {"status": "warning", "message": "El usuario ya está desactivado"}

            resultado_prestamos = {
                "status": "success",
                "prestamos_cancelados": 0,
                "libros_liberados": 0
            }

            from app.models.prestamo_fisico_model import cancelar_prestamos_por_desactivacion_cuenta
            
            try:
                resultado_prestamos = await cancelar_prestamos_por_desactivacion_cuenta(user_id)
                print(f"📚 Préstamos cancelados del usuario {user_id}: {resultado_prestamos}")
            except Exception as e:
                print(f"⚠️ Error al cancelar préstamos: {e}")

            # Desactivar cuenta
            await cursor.execute("""
                UPDATE usuarios 
                SET estado = 'Desactivado'
                WHERE id = %s
            """, (user_id,))
            
            await conn.commit()

            # 🔥 CRÍTICO: Al desactivar, invalidar sesión pero NO limpiar la marca
            await asyncio.gather(
                invalidate_session_async(user_id),
                clear_user_cache_async(user_id, include_session_invalidation=False)  # NO borrar marca de sesión
            )

            return {
                "status": "success", 
                "message": f"Usuario {user_id} desactivado correctamente",
                "prestamos_cancelados": resultado_prestamos.get("prestamos_cancelados", 0),
                "libros_liberados": resultado_prestamos.get("libros_liberados", 0)
            }

        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Error al desactivar: {str(e)}")

@router.put("/reactivar/{user_id}")
async def reactivate_user_by_admin(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        try:
            # 1️⃣ Verificar que el usuario existe
            await cursor.execute("SELECT id, estado FROM usuarios WHERE id = %s", (user_id,))
            user = await cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            print(f"📋 Estado ANTES de reactivar: {user['estado']}")

            if user["estado"] == "Activo":
                return {"status": "warning", "message": "El usuario ya está activo"}

            # 2️⃣ Reactivar cuenta - COMMIT INMEDIATAMENTE
            await cursor.execute("""
                UPDATE usuarios 
                SET estado = 'Activo'
                WHERE id = %s
            """, (user_id,))
            
            await conn.commit()
            print(f"✅ Usuario {user_id} actualizado a 'Activo' en BD")

            # 3️⃣ Verificar que se guardó correctamente
            await cursor.execute("SELECT estado FROM usuarios WHERE id = %s", (user_id,))
            verificacion = await cursor.fetchone()
            print(f"🔍 Verificación post-update: Estado = {verificacion['estado']}")

            if verificacion['estado'] != 'Activo':
                raise Exception(f"Error: El estado no se actualizó correctamente. Estado actual: {verificacion['estado']}")

            # 4️⃣ AHORA SÍ limpiar Redis - DESPUÉS de confirmar que BD está OK
            from app.dependencias.redis import r
            
            def _limpiar_sesion_completa():
                try:
                    keys_criticas = [
                        f"user_session_invalid:{user_id}",
                        f"login_attempts:{user_id}",
                        f"account_locked:{user_id}",
                        f"user_estado:{user_id}",
                        f"user_data:{user_id}",
                        f"prestamos_fisicos_usuario:{user_id}",
                    ]
                    
                    deleted = 0
                    for key in keys_criticas:
                        result = r.delete(key)
                        if result:
                            deleted += 1
                            print(f"  🗑️ Eliminada: {key}")
                    
                    print(f"✅ Redis limpiado para usuario {user_id} ({deleted} claves)")
                    
                    # Verificar que la marca de sesión inválida se eliminó
                    if r.get(f"user_session_invalid:{user_id}"):
                        print(f"⚠️ ALERTA: user_session_invalid:{user_id} aún existe!")
                        r.delete(f"user_session_invalid:{user_id}")  # Forzar eliminación
                    else:
                        print(f"✅ Confirmado: user_session_invalid:{user_id} eliminada")
                        
                except Exception as e:
                    print(f"❌ Error limpiando Redis: {e}")
            
            # Ejecutar limpieza de Redis
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _limpiar_sesion_completa)

            # 5️⃣ Verificación final del estado
            await cursor.execute("SELECT estado FROM usuarios WHERE id = %s", (user_id,))
            estado_final = await cursor.fetchone()
            print(f"🎯 Estado FINAL del usuario {user_id}: {estado_final['estado']}")

            return {
                "status": "success", 
                "message": f"Usuario {user_id} reactivado correctamente. Puede iniciar sesión inmediatamente.",
                "estado_actual": estado_final['estado']
            }

        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            print(f"❌ Error en reactivación: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error al reactivar: {str(e)}")


#  EXPORTAR A EXCEL
@router.get("/export/excel")
async def export_users_excel(current_user: dict = Depends(get_current_user)):
    """Exporta todos los usuarios a un archivo Excel"""
    verify_librarian_role(current_user)

    if not PANDAS_AVAILABLE:
        raise HTTPException(
            status_code=500, 
            detail="pandas no está instalado. Ejecuta: pip install pandas openpyxl"
        )

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                id as 'ID',
                nombre as 'Nombre',
                apellido as 'Apellido',
                correo as 'Correo',
                rol as 'Rol',
                tipo_identificacion as 'Tipo ID',
                num_identificacion as 'Número ID',
                estado as 'Estado'
            FROM usuarios
            ORDER BY id DESC
        """)
        users = await cursor.fetchall()

    if not users:
        raise HTTPException(status_code=404, detail="No hay usuarios para exportar")

    # Crear DataFrame de pandas
    df = pd.DataFrame(users)

    # Crear archivo Excel en memoria
    output = BytesIO()
    
    try:
        # Usar openpyxl como engine para mejor formato
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Usuarios')
            
            # Obtener el worksheet para aplicar formato
            worksheet = writer.sheets['Usuarios']
            
            # Ajustar ancho de columnas
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando Excel: {str(e)}")

    output.seek(0)

    # Nombre del archivo con fecha
    filename = f"usuarios_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


# 📄 EXPORTAR A PDF
@router.get("/export/pdf")
async def export_users_pdf(current_user: dict = Depends(get_current_user)):
    """Exporta todos los usuarios a un archivo PDF"""
    verify_librarian_role(current_user)

    if not FPDF_AVAILABLE:
        raise HTTPException(
            status_code=500, 
            detail="fpdf2 no está instalado. Ejecuta: pip install fpdf2"
        )

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                id,
                nombre,
                apellido,
                correo,
                rol,
                tipo_identificacion,
                num_identificacion,
                estado
            FROM usuarios
            ORDER BY id DESC
        """)
        users = await cursor.fetchall()

    if not users:
        raise HTTPException(status_code=404, detail="No hay usuarios para exportar")

    try:
        # Crear PDF
        pdf = FPDF(orientation='L', unit='mm', format='A4')  # Landscape
        pdf.add_page()
        
        # Título
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, 'Reporte de Usuarios', 0, 1, 'C')
        pdf.ln(5)
        
        # Fecha de generación
        pdf.set_font('Arial', 'I', 10)
        pdf.cell(0, 5, f'Generado el: {datetime.now().strftime("%d/%m/%Y %H:%M")}', 0, 1, 'C')
        pdf.ln(5)
        
        # Encabezados de tabla
        pdf.set_font('Arial', 'B', 9)
        pdf.set_fill_color(182, 64, 125)  # Color morado
        pdf.set_text_color(255, 255, 255)
        
        headers = ['ID', 'Nombre', 'Apellido', 'Correo', 'Rol', 'Tipo ID', 'Num ID', 'Estado']
        widths = [10, 30, 30, 50, 25, 18, 25, 20]
        
        for i, header in enumerate(headers):
            pdf.cell(widths[i], 8, header, 1, 0, 'C', True)
        pdf.ln()
        
        # Datos
        pdf.set_font('Arial', '', 8)
        pdf.set_text_color(0, 0, 0)
        
        for i, user in enumerate(users):
            # Alternar color de fondo
            if i % 2 == 0:
                pdf.set_fill_color(240, 240, 240)
            else:
                pdf.set_fill_color(255, 255, 255)
            
            pdf.cell(widths[0], 7, str(user['id']), 1, 0, 'C', True)
            pdf.cell(widths[1], 7, user['nombre'][:20], 1, 0, 'L', True)
            pdf.cell(widths[2], 7, user['apellido'][:20], 1, 0, 'L', True)
            pdf.cell(widths[3], 7, user['correo'][:35], 1, 0, 'L', True)
            pdf.cell(widths[4], 7, user['rol'], 1, 0, 'C', True)
            pdf.cell(widths[5], 7, user['tipo_identificacion'] or '-', 1, 0, 'C', True)
            pdf.cell(widths[6], 7, user['num_identificacion'] or '-', 1, 0, 'C', True)
            pdf.cell(widths[7], 7, user['estado'], 1, 0, 'C', True)
            pdf.ln()
        
        # Total de usuarios
        pdf.ln(5)
        pdf.set_font('Arial', 'B', 10)
        pdf.cell(0, 10, f'Total de usuarios: {len(users)}', 0, 1, 'R')
        
        # Generar PDF en memoria
        pdf_bytes = pdf.output(dest='S')
        if isinstance(pdf_bytes, str):
            pdf_bytes = pdf_bytes.encode('latin1')
        pdf_output = BytesIO(pdf_bytes)
        pdf_output.seek(0)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")
    
    # Nombre del archivo con fecha
    filename = f"usuarios_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    return StreamingResponse(
        pdf_output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )