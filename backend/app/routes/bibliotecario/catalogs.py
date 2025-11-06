from fastapi import APIRouter, Depends, HTTPException
from app.utils.security import get_current_user
from app.config.database import get_cursor

router = APIRouter(tags=["Catálogos"])


# 📚 AUTORES
@router.get("/autores/")
async def get_autores(current_user: dict = Depends(get_current_user)):
    async with get_cursor() as (conn, cursor):
        await cursor.execute("SELECT id, nombre FROM autores ORDER BY nombre")
        autores = await cursor.fetchall()
    return autores


# 🏢 EDITORIALES
@router.get("/editoriales/")
async def get_editoriales(current_user: dict = Depends(get_current_user)):
    async with get_cursor() as (conn, cursor):
        await cursor.execute("SELECT id, nombre FROM editoriales ORDER BY nombre")
        editoriales = await cursor.fetchall()
    return editoriales


# 🎭 GÉNEROS
@router.get("/generos/")
async def get_generos(current_user: dict = Depends(get_current_user)):
    async with get_cursor() as (conn, cursor):
        await cursor.execute("SELECT id, nombre FROM generos ORDER BY nombre")
        generos = await cursor.fetchall()
    return generos