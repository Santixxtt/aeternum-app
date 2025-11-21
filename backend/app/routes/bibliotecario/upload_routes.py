from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pathlib import Path
import shutil
import uuid
from typing import Optional
from app.utils.security import get_current_user
import os

router = APIRouter(prefix="/uploads", tags=["Uploads"])

# Directorio donde se guardarán las imágenes
UPLOAD_DIR = Path("uploads/book_covers")

# ← MEJORAR: Asegurar que existe cada vez
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Extensiones permitidas
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def verify_librarian_role(current_user: dict):
    """Verifica que el usuario sea bibliotecario"""
    if current_user.get("rol") != "bibliotecario":
        raise HTTPException(
            status_code=403, 
            detail="Acceso denegado: se requiere rol de bibliotecario."
        )


@router.post("/book-cover")
async def upload_book_cover(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Sube una imagen de portada de libro.
    Solo accesible para bibliotecarios.
    """
    verify_librarian_role(current_user)
    
    # ← AGREGAR: Asegurar que el directorio existe
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # Validar extensión del archivo
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no permitido. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validar tamaño del archivo
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Archivo muy grande. Máximo: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    # Generar nombre único para el archivo
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        # Guardar archivo
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # ← AGREGAR: Log para debug
        print(f"✅ Archivo guardado: {file_path.resolve()}")
        
        # Retornar la ruta relativa que se guardará en la BD
        relative_path = f"book_covers/{unique_filename}"
        
        return {
            "status": "success",
            "filename": unique_filename,
            "path": relative_path,
            "url": f"/uploads/{relative_path}"
        }
    
    except Exception as e:
        # Si hay error, eliminar el archivo si se creó
        if file_path.exists():
            file_path.unlink()
        print(f"❌ Error al guardar archivo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al guardar el archivo: {str(e)}"
        )
    finally:
        file.file.close()


@router.get("/{file_path:path}")
async def get_uploaded_file(file_path: str):
    """
    Sirve archivos subidos.
    Accesible públicamente para mostrar las imágenes.
    """
    full_path = UPLOAD_DIR.parent / file_path
    
    # ← AGREGAR: Log para debug
    print(f"🔍 Buscando archivo: {full_path.resolve()}")
    
    if not full_path.exists() or not full_path.is_file():
        print(f"❌ Archivo NO encontrado: {full_path.resolve()}")
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    # Verificar que el archivo esté dentro del directorio permitido
    try:
        full_path.resolve().relative_to(UPLOAD_DIR.parent.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    return FileResponse(full_path)


@router.delete("/book-cover/{filename}")
async def delete_book_cover(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Elimina una imagen de portada.
    Solo accesible para bibliotecarios.
    """
    verify_librarian_role(current_user)
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    try:
        file_path.unlink()
        return {
            "status": "success",
            "message": "Archivo eliminado correctamente"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar el archivo: {str(e)}"
        )