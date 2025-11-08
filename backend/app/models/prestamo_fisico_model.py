from datetime import datetime, timedelta
from app.config.database import get_cursor
from app.utils.email_prestamos import (
    send_prestamo_confirmacion,
    send_prestamo_cancelado,
    send_prestamo_atrasado
)


async def crear_prestamo_fisico(usuario_id: int, libro_id: int, fecha_recogida: str):
    async with get_cursor() as (conn, cursor):
        try:
            # 🔹 VALIDAR LÍMITE DE 2 PRÉSTAMOS ACTIVOS
            await cursor.execute("""
                SELECT COUNT(*) as total
                FROM prestamos_fisicos
                WHERE usuario_id = %s 
                AND estado IN ('pendiente', 'activo')
            """, (usuario_id,))
            result = await cursor.fetchone()
            
            if result["total"] >= 2:
                return {
                    "status": "error", 
                    "message": "Has alcanzado el límite de 2 préstamos físicos activos. Devuelve o cancela un préstamo para solicitar uno nuevo."
                }
            
            # 🔹 Validar que el libro existe
            await cursor.execute("""
                SELECT id, titulo, autor_id, cantidad_disponible, openlibrary_key
                FROM libros
                WHERE id = %s
            """, (libro_id,))
            libro = await cursor.fetchone()
            if not libro:
                return {"status": "error", "message": "Libro no encontrado"}

            # 🔹 Obtener nombre del autor (si existe)
            autor_nombre = "Desconocido"
            if libro["autor_id"]:
                await cursor.execute("SELECT nombre FROM autores WHERE id = %s", (libro["autor_id"],))
                autor_result = await cursor.fetchone()
                if autor_result:
                    autor_nombre = autor_result["nombre"]

            # 🔹 Calcular fechas de recogida y devolución
            fecha_recogida_obj = datetime.strptime(fecha_recogida, "%Y-%m-%d")
            fecha_devolucion_obj = fecha_recogida_obj + timedelta(days=12)
            fecha_devolucion = fecha_devolucion_obj.strftime("%Y-%m-%d")

            # 🔹 Obtener datos del usuario
            await cursor.execute("""
                SELECT nombre, apellido, correo
                FROM usuarios
                WHERE id = %s
            """, (usuario_id,))
            usuario = await cursor.fetchone()
            if not usuario:
                return {"status": "error", "message": "Usuario no encontrado"}

            # 🔹 Insertar préstamo físico
            await cursor.execute("""
                INSERT INTO prestamos_fisicos 
                (usuario_id, libro_id, titulo, autor, openlibrary_key, 
                 fecha_recogida, fecha_devolucion, estado)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'pendiente')
            """, (
                usuario_id,
                libro_id,
                libro["titulo"],
                autor_nombre,
                libro["openlibrary_key"],
                fecha_recogida,
                fecha_devolucion
            ))

            prestamo_id = cursor.lastrowid

            # 🔹 Descontar stock
            await cursor.execute("""
                UPDATE libros
                SET cantidad_disponible = cantidad_disponible - 1
                WHERE id = %s
            """, (libro_id,))

            await conn.commit()

            # 🔹 Enviar correo de confirmación
            try:
                nombre_completo = f"{usuario['nombre']} {usuario['apellido']}"
                await send_prestamo_confirmacion(
                    recipient_email=usuario["correo"],
                    nombre_usuario=nombre_completo,
                    titulo_libro=libro["titulo"],
                    fecha_recogida=fecha_recogida,
                    fecha_devolucion=fecha_devolucion
                )

                await cursor.execute("""
                    UPDATE prestamos_fisicos
                    SET correo_confirmacion_enviado = TRUE
                    WHERE id = %s
                """, (prestamo_id,))
                await conn.commit()

            except Exception as e:
                print(f"⚠️ Error al enviar correo (préstamo creado exitosamente): {e}")

            return {
                "status": "success",
                "message": "Préstamo físico creado exitosamente",
                "prestamo_id": prestamo_id,
                "fechas": {
                    "recogida": fecha_recogida,
                    "devolucion": fecha_devolucion,
                    "dias_prestamo": 12
                }
            }

        except Exception as e:
            await conn.rollback()
            print(f"❌ Error en crear_prestamo_fisico:", e)
            return {"status": "error", "message": str(e)}


async def obtener_prestamos_usuario(usuario_id: int):
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT 
                    id, libro_id, titulo, autor, openlibrary_key, fecha_solicitud,
                    fecha_recogida, fecha_devolucion, fecha_devolucion_real,
                    estado, correo_confirmacion_enviado, correo_recordatorio_enviado,
                    correo_atrasado_enviado, created_at
                FROM prestamos_fisicos
                WHERE usuario_id = %s
                ORDER BY created_at DESC
            """, (usuario_id,))
            prestamos = await cursor.fetchall()
            return {"status": "success", "prestamos": prestamos}
        except Exception as e:
            print(f"❌ Error obtener_prestamos_usuario:", e)
            return {"status": "error", "message": str(e)}


async def cancelar_prestamo_fisico(prestamo_id: int, usuario_id: int):
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT p.id, p.libro_id, p.titulo, u.nombre, u.apellido, u.correo
                FROM prestamos_fisicos p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.id = %s AND p.usuario_id = %s AND p.estado != 'cancelado'
            """, (prestamo_id, usuario_id))

            prestamo = await cursor.fetchone()
            if not prestamo:
                return {"status": "error", "message": "Préstamo no encontrado o ya cancelado"}

            # 🔹 Cancelar préstamo
            await cursor.execute("""
                UPDATE prestamos_fisicos
                SET estado = 'cancelado', fecha_devolucion_real = CURRENT_DATE()
                WHERE id = %s
            """, (prestamo_id,))

            # 🔹 Devolver stock
            await cursor.execute("""
                UPDATE libros
                SET cantidad_disponible = cantidad_disponible + 1
                WHERE id = %s
            """, (prestamo["libro_id"],))

            await conn.commit()

            # 🔹 Enviar correo de cancelación
            try:
                nombre_completo = f"{prestamo['nombre']} {prestamo['apellido']}"
                await send_prestamo_cancelado(
                    recipient_email=prestamo["correo"],
                    nombre_usuario=nombre_completo,
                    titulo_libro=prestamo["titulo"]
                )
                await cursor.execute("""
                    UPDATE prestamos_fisicos
                    SET correo_cancelacion_enviado = TRUE
                    WHERE id = %s
                """, (prestamo_id,))
                await conn.commit()
            except Exception as e:
                print(f"⚠️ Error correo cancelación:", e)

            return {"status": "success", "message": "Préstamo cancelado exitosamente"}

        except Exception as e:
            await conn.rollback()
            print(f"❌ Error cancelar préstamo:", e)
            return {"status": "error", "message": str(e)}


async def actualizar_estado_prestamo(prestamo_id: int, nuevo_estado: str):
    estados_validos = ["pendiente", "activo", "devuelto", "atrasado", "cancelado"]

    if nuevo_estado not in estados_validos:
        return {"status": "error", "message": f"Estado inválido. Estados permitidos: {estados_validos}"}

    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT p.id, p.libro_id, p.estado, p.fecha_devolucion, u.correo, u.nombre, u.apellido, p.titulo
                FROM prestamos_fisicos p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.id = %s
            """, (prestamo_id,))
            prestamo = await cursor.fetchone()
            if not prestamo:
                return {"status": "error", "message": "Préstamo no encontrado"}

            if prestamo["estado"] == "devuelto":
                return {"status": "error", "message": "El préstamo ya fue devuelto"}

            # 🔹 Si se marca como atrasado
            if nuevo_estado == "atrasado":
                await cursor.execute("""
                    UPDATE prestamos_fisicos
                    SET estado = 'atrasado'
                    WHERE id = %s
                """, (prestamo_id,))
                await conn.commit()

                try:
                    await send_prestamo_atrasado(
                        recipient_email=prestamo["correo"],
                        nombre_usuario=f"{prestamo['nombre']} {prestamo['apellido']}",
                        titulo_libro=prestamo["titulo"],
                        fecha_devolucion=prestamo["fecha_devolucion"]
                    )
                    await cursor.execute("""
                        UPDATE prestamos_fisicos
                        SET correo_atrasado_enviado = TRUE
                        WHERE id = %s
                    """, (prestamo_id,))
                    await conn.commit()
                except Exception as e:
                    print(f"⚠️ Error correo atrasado:", e)

                return {"status": "success", "message": "Préstamo marcado como atrasado ✅"}

            # 🔹 Si se marca como devuelto
            if nuevo_estado == "devuelto":
                await cursor.execute("""
                    UPDATE prestamos_fisicos
                    SET estado = %s, fecha_devolucion_real = CURRENT_DATE()
                    WHERE id = %s
                """, (nuevo_estado, prestamo_id))
                await cursor.execute("""
                    UPDATE libros
                    SET cantidad_disponible = cantidad_disponible + 1
                    WHERE id = %s
                """, (prestamo["libro_id"],))

            else:
                await cursor.execute("""
                    UPDATE prestamos_fisicos
                    SET estado = %s
                    WHERE id = %s
                """, (nuevo_estado, prestamo_id))

            await conn.commit()
            return {"status": "success", "message": f"Estado actualizado a '{nuevo_estado}' ✅"}

        except Exception as e:
            await conn.rollback()
            print("❌ Error actualizar estado:", e)
            return {"status": "error", "message": str(e)}
