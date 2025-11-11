from fastapi import HTTPException
from datetime import datetime
from app.config.database import get_cursor


def normalize_ol_key(olKey: str) -> str:
    """Normaliza la clave de OpenLibrary eliminando prefijos y barras."""
    if olKey.startswith("/"):
        olKey = olKey[1:]
    if olKey.startswith("works/"):
        olKey = olKey.replace("works/", "")
    return olKey.strip()


async def libro_exists(openlibrary_key: str):
    """Verifica si un libro existe en la tabla `libros`."""
    normalized_key = normalize_ol_key(openlibrary_key)
    async with get_cursor() as (conn, cursor):
        await cursor.execute("SELECT id FROM libros WHERE openlibrary_key = %s", (normalized_key,))
        return await cursor.fetchone()


async def create_libro(openlibrary_key: str, titulo: str, autor_id: int, cover_id: int | None):
    """Inserta un nuevo libro."""
    normalized_key = normalize_ol_key(openlibrary_key)
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                INSERT INTO libros (openlibrary_key, titulo, autor_id, cover_id)
                VALUES (%s, %s, %s, %s)
            """, (normalized_key, titulo, autor_id, cover_id))
            await conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"❌ Error DB al crear libro: {e}")
            await conn.rollback()
            return None


def split_autor_name(autor_completo: str):
    """Divide el nombre completo del autor."""
    partes = autor_completo.split()
    if len(partes) > 1:
        apellido = partes[-1]
        nombre = " ".join(partes[:-1])
        return nombre, apellido
    return autor_completo, ""


async def get_or_create_autor(nombre: str, apellido: str):
    """Obtiene o crea un autor."""
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("SELECT id FROM autores WHERE nombre=%s AND apellido=%s", (nombre, apellido))
            autor = await cursor.fetchone()
            if autor:
                return autor["id"]

            await cursor.execute(
                "INSERT INTO autores (nombre, apellido, nacionalidad) VALUES (%s, %s, %s)",
                (nombre, apellido, "Desconocida"),
            )
            await conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"❌ Error DB al obtener/crear autor: {e}")
            await conn.rollback()
            return None

async def get_or_create_genero(nombre_genero: str):
    """Obtiene o crea un género."""
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("SELECT id FROM generos WHERE nombre=%s", (nombre_genero,))
            genero = await cursor.fetchone()
            if genero:
                return genero["id"]
            
            await cursor.execute(
                "INSERT INTO generos (nombre) VALUES (%s)",
                (nombre_genero,)
            )
            await conn.commit()
            return cursor.lastrowid
        except Exception as e:
            await conn.rollback()
            print(f"❌ Error DB al obtener/crear género: {e}")
            return None

async def get_or_create_editorial(nombre_editorial: str):
    """Obtiene o crea una editorial."""
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("SELECT id FROM editoriales WHERE nombre=%s", (nombre_editorial,))
            editorial = await cursor.fetchone()
            if editorial:
                return editorial["id"]
            
            await cursor.execute(
                "INSERT INTO editoriales (nombre) VALUES (%s)",
                (nombre_editorial,)
            )
            await conn.commit()
            return cursor.lastrowid
        except Exception as e:
            await conn.rollback()
            print(f"❌ Error DB al obtener/crear editorial: {e}")
            return None


async def add_to_wishlist(usuario_id: int, libro_id: int):
    """Añade un libro a la lista de deseos del usuario."""
    async with get_cursor() as (conn, cursor):
        try:
            # ✅ DEBUGGING: Imprimir lo que estamos buscando
            print(f"🔍 Verificando si existe: usuario_id={usuario_id}, libro_id={libro_id}")
            
            await cursor.execute(
                "SELECT id FROM lista_deseos WHERE usuario_id=%s AND libro_id=%s",
                (usuario_id, libro_id),
            )
            exists = await cursor.fetchone()
            
            print(f"🔍 Resultado de búsqueda: {exists}")
            
            if exists:
                print(f"⚠️ Ya existe en lista_deseos con id={exists['id']}")
                return False

            print(f"✅ Insertando en lista_deseos...")
            await cursor.execute(
                "INSERT INTO lista_deseos (usuario_id, libro_id) VALUES (%s, %s)",
                (usuario_id, libro_id),
            )
            await conn.commit()
            print(f"✅ Insertado correctamente")
            return True
        except Exception as e:
            print(f"❌ Error DB al añadir a lista de deseos: {e}")
            await conn.rollback()
            return False


async def get_wishlist(usuario_id: int):
    """Obtiene la lista de deseos del usuario."""
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT 
                    l.id, 
                    l.titulo, 
                    l.cover_id, 
                    l.openlibrary_key, 
                    CONCAT(a.nombre, ' ', a.apellido) AS autor, 
                    l.descripcion, 
                    COALESCE(ed.nombre, 'Desconocida') AS editorial, 
                    COALESCE(g.nombre, 'No Clasificado') AS genero
                FROM lista_deseos d
                INNER JOIN libros l ON d.libro_id = l.id
                INNER JOIN autores a ON l.autor_id = a.id
                LEFT JOIN editoriales ed ON l.editorial_id = ed.id 
                LEFT JOIN generos g ON l.genero_id = g.id
                WHERE d.usuario_id = %s
                ORDER BY d.id DESC
            """, (usuario_id,))
            
            result = await cursor.fetchall()
            print(f"📊 Query ejecutada, resultados: {len(result) if result else 0}")
            return result or []
        except Exception as e:
            print(f"❌ Error en get_wishlist: {e}")
            import traceback
            traceback.print_exc()
            return []


async def ensure_book_is_persisted(libro_data: dict) -> int | None:
    """Garantiza que el libro y sus relaciones existan en la DB para la lista de deseos."""

    normalized_key = normalize_ol_key(libro_data["openlibrary_key"])

    # ✅ Crear las entidades relacionadas (autor, género, editorial)
    nombre_autor, apellido_autor = split_autor_name(libro_data.get("autor", "Desconocido"))
    autor_id = await get_or_create_autor(nombre_autor, apellido_autor)
    genero_id = await get_or_create_genero(libro_data.get("genero", "No Clasificado"))
    editorial_id = await get_or_create_editorial(libro_data.get("editorial", "Desconocida"))

    if not autor_id or not genero_id or not editorial_id:
        print(f"❌ Error al crear entidades relacionadas")
        return None

    # ✅ Verificar si el libro ya existe
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute(
                "SELECT id, genero_id, editorial_id FROM libros WHERE openlibrary_key = %s",
                (normalized_key,)
            )
            libro_existente = await cursor.fetchone()

            if libro_existente:
                print(f"📚 Libro ya existe con id={libro_existente['id']}")
                return libro_existente["id"]

        except Exception as e:
            print(f"❌ Error al verificar libro existente: {e}")

    # ✅ Si no existe, crear el libro
    titulo = libro_data.get("titulo")
    descripcion = libro_data.get("descripcion", "")
    cover_id = libro_data.get("cover_id")
    fecha_publicacion = libro_data.get("fecha_publicacion", None)

    # 🧩 Normalización segura de la fecha_publicacion
    try:
        if fecha_publicacion:
            fecha_str = str(fecha_publicacion).strip()

            # Caso: solo año, ejemplo "2018"
            if fecha_str.isdigit() and len(fecha_str) == 4:
                year = int(fecha_str)
                if 1000 <= year <= 9999:
                    fecha_publicacion = f"{year}-01-01"
                else:
                    fecha_publicacion = None

            # Caso: formato "YYYY-MM-DD"
            elif len(fecha_str.split("-")) == 3:
                try:
                    fecha_publicacion = datetime.strptime(fecha_str, "%Y-%m-%d").date().isoformat()
                except ValueError:
                    fecha_publicacion = None

            else:
                fecha_publicacion = None
        else:
            fecha_publicacion = None
    except Exception as e:
        print(f"⚠️ Error al normalizar fecha_publicacion: {e}")
        fecha_publicacion = None

    # ✅ Insertar el nuevo libro
    async with get_cursor() as (conn, cursor):
        try:
            print(f"📝 Creando nuevo libro: {titulo}")
            print(f"📝 Con: genero_id={genero_id}, editorial_id={editorial_id}, fecha_publicacion={fecha_publicacion}")

            await cursor.execute(
                """
                INSERT INTO libros 
                (openlibrary_key, titulo, autor_id, editorial_id, genero_id, cover_id, descripcion, fecha_publicacion) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (normalized_key, titulo, autor_id, editorial_id, genero_id, cover_id, descripcion, fecha_publicacion)
            )

            await conn.commit()
            libro_id = cursor.lastrowid
            print(f"✅ Libro creado con id={libro_id}")
            return libro_id

        except Exception as e:
            await conn.rollback()
            print(f"❌ Error en ensure_book_is_persisted: {e}")
            import traceback
            traceback.print_exc()
            return None


async def ensure_book_for_loan(libro_data: dict) -> dict | None:
    """
    Garantiza que el libro exista en la DB para préstamos físicos.
    """
    # 1. Obtener/Crear Autor, Género y Editorial
    nombre_autor, apellido_autor = split_autor_name(libro_data.get("autor", "Desconocido"))
    autor_id = await get_or_create_autor(nombre_autor, apellido_autor)
    
    genero_id = await get_or_create_genero(libro_data.get("genero", "No Clasificado"))
    editorial_id = await get_or_create_editorial(libro_data.get("editorial", "Desconocida"))
    
    if not autor_id or not genero_id or not editorial_id:
        return None 

    normalized_key = normalize_ol_key(libro_data["openlibrary_key"])
    
    titulo = libro_data.get("titulo")
    descripcion = libro_data.get("descripcion", "")
    cover_id = libro_data.get("cover_id")
    fecha_publicacion = libro_data.get("fecha_publicacion", None)

    async with get_cursor() as (conn, cursor):
        try:
            # 2. Buscar libro existente
            await cursor.execute(
                "SELECT id, cantidad_disponible FROM libros WHERE openlibrary_key = %s",
                (normalized_key,)
            )
            libro = await cursor.fetchone()
            
            if libro:
                return {
                    "libro_id": libro["id"],
                    "cantidad_disponible": libro["cantidad_disponible"] or 0
                }

            # 3. Crear libro si no existe (con cantidad_disponible = 1 por defecto)
            await cursor.execute(
                """
                INSERT INTO libros 
                (openlibrary_key, titulo, autor_id, editorial_id, genero_id, cover_id, descripcion, fecha_publicacion, cantidad_disponible) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (normalized_key, titulo, autor_id, editorial_id, genero_id, cover_id, descripcion, fecha_publicacion, 1)
            )

            await conn.commit()
            return {
                "libro_id": cursor.lastrowid,
                "cantidad_disponible": 1
            }

        except Exception as e:
            await conn.rollback()
            print(f"❌ Error en ensure_book_for_loan: {e}")
            return None

async def eliminar_de_lista_deseos(usuario_id: int, libro_id: int):
    """Elimina un libro de la lista de deseos del usuario."""
    async with get_cursor() as (conn, cursor):
        await cursor.execute(
            "SELECT * FROM lista_deseos WHERE usuario_id = %s AND libro_id = %s",
            (usuario_id, libro_id)
        )
        existe = await cursor.fetchone()

        if not existe:
            print(f"⚠️ No existe en DB: usuario_id={usuario_id}, libro_id={libro_id}")
            raise HTTPException(status_code=404, detail="Libro no encontrado en la lista de deseos.")

        await cursor.execute(
            "DELETE FROM lista_deseos WHERE usuario_id = %s AND libro_id = %s",
            (usuario_id, libro_id)
        )
        await conn.commit()
        return {"message": "Libro eliminado correctamente"}