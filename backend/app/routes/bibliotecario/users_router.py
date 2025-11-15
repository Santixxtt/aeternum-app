from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from typing import Any, Dict
from app.utils.security import get_current_user
from app.config.database import get_cursor
from io import BytesIO
from datetime import datetime
from app.dependencias.redis import r


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

            # 🔥 NUEVO: Marcar sesión como inválida en Redis
            r.setex(f"user_session_invalid:{user_id}", 3600, "1")  # 1 hora de bloqueo
            
            # Limpiar caché
            r.delete(f"login_attempts:{user_id}")
            r.delete(f"account_locked:{user_id}")
            r.delete(f"prestamos_fisicos_usuario:{user_id}")
            r.delete(f"user_data:{user_id}")  # ✅ Limpiar caché de usuario

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
            await cursor.execute("SELECT id, estado FROM usuarios WHERE id = %s", (user_id,))
            user = await cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            if user["estado"] == "Activo":
                return {"status": "warning", "message": "El usuario ya está activo"}

            # Reactivar cuenta
            await cursor.execute("""
                UPDATE usuarios 
                SET estado = 'Activo'
                WHERE id = %s
            """, (user_id,))
            
            await conn.commit()

            # 🔥 NUEVO: Limpiar marca de sesión inválida
            r.delete(f"user_session_invalid:{user_id}")
            r.delete(f"login_attempts:{user_id}")
            r.delete(f"account_locked:{user_id}")
            r.delete(f"user_data:{user_id}")  # ✅ Limpiar caché de usuario

            return {"status": "success", "message": f"Usuario {user_id} reactivado correctamente"}

        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Error al reactivar: {str(e)}")


# 📥 EXPORTAR A EXCEL
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
        # ✅ ELIMINADO created_at de la query
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
        # ✅ ELIMINADO created_at de la query
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