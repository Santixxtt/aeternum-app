from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from typing import Any, Dict
from app.utils.security import get_current_user
from app.config.database import get_cursor
from io import BytesIO
from datetime import datetime

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

router = APIRouter(prefix="/admin/books", tags=["Admin - Books"])


# 🧩 Middleware de permisos (solo bibliotecarios)
def verify_librarian_role(current_user: dict):
    if current_user.get("rol") != "bibliotecario":
        raise HTTPException(
            status_code=403, 
            detail="Acceso denegado: se requiere rol de bibliotecario."
        )


# 📋 Obtener todos los libros
@router.get("/")
async def get_all_books(current_user: dict = Depends(get_current_user)):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                l.id, 
                l.titulo, 
                l.descripcion, 
                l.autor_id, 
                l.editorial_id, 
                l.genero_id, 
                l.fecha_publicacion, 
                l.cantidad_disponible, 
                l.estado, 
                l.openlibrary_key, 
                l.cover_id,
                a.nombre AS autor_nombre,
                e.nombre AS editorial_nombre,
                g.nombre AS genero_nombre
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            LEFT JOIN generos g ON l.genero_id = g.id
            ORDER BY l.id DESC
        """)
        books = await cursor.fetchall()

    return {"total": len(books), "libros": books}


# 🔍 Obtener un libro por ID
@router.get("/{book_id}")
async def get_book_by_id(
    book_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                l.*,
                a.nombre AS autor_nombre,
                e.nombre AS editorial_nombre,
                g.nombre AS genero_nombre
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            LEFT JOIN generos g ON l.genero_id = g.id
            WHERE l.id = %s
        """, (book_id,))
        book = await cursor.fetchone()

    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado.")
    
    return book


# ➕ Crear un nuevo libro
@router.post("/")
async def create_book(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    titulo = payload.get("titulo")
    descripcion = payload.get("descripcion", "")
    autor_id = payload.get("autor_id")
    editorial_id = payload.get("editorial_id")
    genero_id = payload.get("genero_id")
    fecha_publicacion = payload.get("fecha_publicacion")
    cantidad_disponible = payload.get("cantidad_disponible", 1)
    openlibrary_key = payload.get("openlibrary_key", "") or None
    cover_id = payload.get("cover_id", 0)

    if not titulo or not autor_id or not editorial_id or not genero_id:
        raise HTTPException(
            status_code=400, 
            detail="Faltan campos requeridos: titulo, autor_id, editorial_id, genero_id"
        )

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            INSERT INTO libros (
                titulo, descripcion, autor_id, editorial_id, genero_id, 
                fecha_publicacion, cantidad_disponible, openlibrary_key, cover_id, estado
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'Activo')
        """, (
            titulo, descripcion, autor_id, editorial_id, genero_id,
            fecha_publicacion, cantidad_disponible, openlibrary_key, cover_id
        ))
        await conn.commit()
        libro_id = cursor.lastrowid

    return {
        "status": "success",
        "message": "Libro creado correctamente",
        "libro_id": libro_id
    }


# ✏️ Actualizar un libro
@router.put("/{book_id}")
async def update_book(
    book_id: int,
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    titulo = payload.get("titulo")
    descripcion = payload.get("descripcion", "")
    autor_id = payload.get("autor_id")
    editorial_id = payload.get("editorial_id")
    genero_id = payload.get("genero_id")
    fecha_publicacion = payload.get("fecha_publicacion")
    cantidad_disponible = payload.get("cantidad_disponible", 1)
    openlibrary_key = payload.get("openlibrary_key", "") or None
    cover_id = payload.get("cover_id", 0)

    if not titulo or not autor_id or not editorial_id or not genero_id:
        raise HTTPException(
            status_code=400, 
            detail="Faltan campos requeridos"
        )

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            UPDATE libros 
            SET titulo = %s, descripcion = %s, autor_id = %s, editorial_id = %s, 
                genero_id = %s, fecha_publicacion = %s, cantidad_disponible = %s,
                openlibrary_key = %s, cover_id = %s
            WHERE id = %s
        """, (
            titulo, descripcion, autor_id, editorial_id, genero_id,
            fecha_publicacion, cantidad_disponible, openlibrary_key, 
            cover_id, book_id
        ))
        await conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404, 
                detail="Libro no encontrado"
            )

    return {"status": "success", "message": "Libro actualizado correctamente"}


# 🚫 Desactivar un libro
@router.put("/desactivar/{book_id}")
async def deactivate_book(
    book_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute(
            "UPDATE libros SET estado = 'Desactivado' WHERE id = %s", 
            (book_id,)
        )
        await conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404, 
                detail="Libro no encontrado"
            )

    return {
        "status": "success", 
        "message": f"Libro {book_id} desactivado correctamente."
    }


# ✅ Activar un libro
@router.put("/activar/{book_id}")
async def activate_book(
    book_id: int,
    current_user: dict = Depends(get_current_user)
):
    verify_librarian_role(current_user)

    async with get_cursor() as (conn, cursor):
        await cursor.execute(
            "UPDATE libros SET estado = 'Activo' WHERE id = %s", 
            (book_id,)
        )
        await conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404, 
                detail="Libro no encontrado"
            )

    return {
        "status": "success", 
        "message": f"Libro {book_id} activado correctamente."
    }


# 📥 EXPORTAR A EXCEL
@router.get("/export/excel")
async def export_books_excel(current_user: dict = Depends(get_current_user)):
    """Exporta todos los libros a un archivo Excel"""
    verify_librarian_role(current_user)

    if not PANDAS_AVAILABLE:
        raise HTTPException(
            status_code=500, 
            detail="pandas no está instalado. Ejecuta: pip install pandas openpyxl"
        )

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                l.id as 'ID',
                l.titulo as 'Título',
                a.nombre as 'Autor',
                e.nombre as 'Editorial',
                g.nombre as 'Género',
                l.fecha_publicacion as 'Fecha Publicación',
                l.cantidad_disponible as 'Disponibles',
                l.estado as 'Estado',
                l.descripcion as 'Descripción'
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            LEFT JOIN generos g ON l.genero_id = g.id
            ORDER BY l.id DESC
        """)
        books = await cursor.fetchall()

    if not books:
        raise HTTPException(status_code=404, detail="No hay libros para exportar")

    # Crear DataFrame de pandas
    df = pd.DataFrame(books)

    # Crear archivo Excel en memoria
    output = BytesIO()
    
    try:
        # Usar openpyxl como engine para mejor formato
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Libros')
            
            # Obtener el worksheet para aplicar formato
            worksheet = writer.sheets['Libros']
            
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
    filename = f"libros_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


# 📄 EXPORTAR A PDF
@router.get("/export/pdf")
async def export_books_pdf(current_user: dict = Depends(get_current_user)):
    """Exporta todos los libros a un archivo PDF"""
    verify_librarian_role(current_user)

    if not FPDF_AVAILABLE:
        raise HTTPException(
            status_code=500, 
            detail="fpdf2 no está instalado. Ejecuta: pip install fpdf2"
        )

    async with get_cursor() as (conn, cursor):
        await cursor.execute("""
            SELECT 
                l.id,
                l.titulo,
                a.nombre as autor,
                e.nombre as editorial,
                g.nombre as genero,
                l.fecha_publicacion,
                l.cantidad_disponible,
                l.estado
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            LEFT JOIN generos g ON l.genero_id = g.id
            ORDER BY l.id DESC
        """)
        books = await cursor.fetchall()

    if not books:
        raise HTTPException(status_code=404, detail="No hay libros para exportar")

    # Función auxiliar para limpiar texto con caracteres especiales
    def clean_text(text):
        if not text:
            return '-'
        # Reemplazar caracteres no ASCII con equivalentes ASCII
        replacements = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
            'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
            'ñ': 'n', 'Ñ': 'N', 'ü': 'u', 'Ü': 'U',
            '"': '"', '"': '"', ''': "'", ''': "'",
            '—': '-', '–': '-', '…': '...',
        }
        text = str(text)
        for old, new in replacements.items():
            text = text.replace(old, new)
        # Eliminar cualquier carácter no ASCII restante
        return ''.join(char if ord(char) < 128 else '?' for char in text)
    
    try:
        # Crear PDF
        pdf = FPDF(orientation='L', unit='mm', format='A4')  # Landscape
        pdf.add_page()
        
        # Título
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, 'Catalogo de Libros', 0, 1, 'C')
        pdf.ln(5)
        
        # Fecha de generación
        pdf.set_font('Arial', 'I', 10)
        pdf.cell(0, 5, f'Generado el: {datetime.now().strftime("%d/%m/%Y %H:%M")}', 0, 1, 'C')
        pdf.ln(5)
        
        # Encabezados de tabla
        pdf.set_font('Arial', 'B', 8)
        pdf.set_fill_color(182, 64, 125)  # Color morado
        pdf.set_text_color(255, 255, 255)
        
        headers = ['ID', 'Titulo', 'Autor', 'Editorial', 'Genero', 'F. Pub.', 'Disp.', 'Estado']
        widths = [10, 60, 40, 40, 35, 25, 15, 20]
        
        for i, header in enumerate(headers):
            pdf.cell(widths[i], 8, header, 1, 0, 'C', True)
        pdf.ln()
        
        # Datos
        pdf.set_font('Arial', '', 7)
        pdf.set_text_color(0, 0, 0)
        
        for i, book in enumerate(books):
            # Alternar color de fondo
            if i % 2 == 0:
                pdf.set_fill_color(240, 240, 240)
            else:
                pdf.set_fill_color(255, 255, 255)
            
            # Limpiar todos los textos antes de agregarlos al PDF
            titulo = clean_text(book['titulo'])[:40] if book['titulo'] else '-'
            autor = clean_text(book['autor'])[:25] if book['autor'] else '-'
            editorial = clean_text(book['editorial'])[:25] if book['editorial'] else '-'
            genero = clean_text(book['genero'])[:20] if book['genero'] else '-'
            fecha = clean_text(str(book['fecha_publicacion'])) if book['fecha_publicacion'] else '-'
            estado = clean_text(book['estado'])
            
            pdf.cell(widths[0], 7, str(book['id']), 1, 0, 'C', True)
            pdf.cell(widths[1], 7, titulo, 1, 0, 'L', True)
            pdf.cell(widths[2], 7, autor, 1, 0, 'L', True)
            pdf.cell(widths[3], 7, editorial, 1, 0, 'L', True)
            pdf.cell(widths[4], 7, genero, 1, 0, 'L', True)
            pdf.cell(widths[5], 7, fecha, 1, 0, 'C', True)
            pdf.cell(widths[6], 7, str(book['cantidad_disponible']), 1, 0, 'C', True)
            pdf.cell(widths[7], 7, estado, 1, 0, 'C', True)
            pdf.ln()
        
        # Total de libros
        pdf.ln(5)
        pdf.set_font('Arial', 'B', 10)
        pdf.cell(0, 10, f'Total de libros: {len(books)}', 0, 1, 'R')
        
        # Generar PDF en memoria
        pdf_bytes = pdf.output(dest='S')
        if isinstance(pdf_bytes, str):
            pdf_bytes = pdf_bytes.encode('latin1')
        pdf_output = BytesIO(pdf_bytes)
        pdf_output.seek(0)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")
    
    # Nombre del archivo con fecha
    filename = f"libros_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    return StreamingResponse(
        pdf_output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )