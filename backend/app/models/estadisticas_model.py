from datetime import date, timedelta, datetime
import pytz
from app.config.database import get_cursor


async def obtener_estadisticas_bibliotecario():
    """Obtiene estadísticas generales para el dashboard del bibliotecario"""
    async with get_cursor() as (conn, cursor):
        try:
            hoy = date.today()
            
            # 📚 Total de préstamos activos (pendiente, activo, atrasado)
            await cursor.execute("""
                SELECT COUNT(*) as total
                FROM prestamos_fisicos
                WHERE estado IN ('pendiente', 'activo', 'atrasado')
            """)
            result = await cursor.fetchone()
            total_activos = result["total"] if result else 0
            
            # ⏰ Préstamos pendientes de aprobar (estado = 'pendiente')
            await cursor.execute("""
                SELECT COUNT(*) as total
                FROM prestamos_fisicos
                WHERE estado = 'pendiente'
            """)
            result = await cursor.fetchone()
            pendientes_aprobar = result["total"] if result else 0
            
            # 📅 Préstamos para recoger hoy (fecha_recogida = hoy y estado = 'activo')
            await cursor.execute("""
                SELECT COUNT(*) as total
                FROM prestamos_fisicos
                WHERE fecha_recogida = %s AND estado = 'activo'
            """, (hoy,))
            result = await cursor.fetchone()
            para_recoger_hoy = result["total"] if result else 0
            
            # ⚠ Préstamos vencidos (fecha_devolucion < hoy y estado IN ('activo', 'atrasado'))
            await cursor.execute("""
                SELECT COUNT(*) as total
                FROM prestamos_fisicos
                WHERE fecha_devolucion < %s 
                AND estado IN ('activo', 'atrasado')
            """, (hoy,))
            result = await cursor.fetchone()
            vencidos = result["total"] if result else 0
            
            return {
                "status": "success",
                "estadisticas": {
                    "total_activos": total_activos,
                    "pendientes_aprobar": pendientes_aprobar,
                    "para_recoger_hoy": para_recoger_hoy,
                    "vencidos": vencidos
                }
            }
            
        except Exception as e:
            print(f"❌ Error obtener_estadisticas_bibliotecario: {e}")
            return {"status": "error", "message": str(e)}


async def obtener_prestamos_recientes(limit: int = 10):
    """Obtiene los préstamos más recientes con información del usuario"""
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT 
                    p.id,
                    p.libro_id,
                    p.titulo,
                    p.autor,
                    p.usuario_id,
                    u.nombre,
                    u.apellido,
                    u.correo,
                    p.fecha_solicitud,
                    p.fecha_recogida,
                    p.fecha_devolucion,
                    p.estado,
                    p.created_at
                FROM prestamos_fisicos p
                JOIN usuarios u ON p.usuario_id = u.id
                ORDER BY p.created_at DESC
                LIMIT %s
            """, (limit,))
            
            prestamos = await cursor.fetchall()
            
            return {
                "status": "success",
                "prestamos": prestamos
            }
            
        except Exception as e:
            print(f"❌ Error obtener_prestamos_recientes: {e}")
            return {"status": "error", "message": str(e)}


async def obtener_alertas_bibliotecario():
    """Obtiene alertas de libros que se recogen hoy y préstamos por vencer"""
    async with get_cursor() as (conn, cursor):
        try:
            tz = pytz.timezone("America/Bogota")
            hoy = datetime.now(tz).date()
            manana = hoy + timedelta(days=1)

            # 📘 Libros que se recogen hoy (comparando por rango de fecha local)
            await cursor.execute("""
                SELECT 
                    p.id,
                    p.titulo,
                    p.usuario_id,
                    u.nombre,
                    u.apellido,
                    u.correo,
                    p.fecha_recogida
                FROM prestamos_fisicos p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE DATE(p.fecha_recogida) = DATE(%s)
                AND p.estado IN ('pendiente', 'activo')
                ORDER BY p.fecha_recogida ASC
                LIMIT 5
            """, (hoy,))
            recogen_hoy = await cursor.fetchall()


            # ⚠️ Préstamos que vencen hoy o mañana
            await cursor.execute("""
                SELECT 
                    p.id,
                    p.titulo,
                    p.usuario_id,
                    u.nombre,
                    u.apellido,
                    u.correo,
                    p.fecha_devolucion
                FROM prestamos_fisicos p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.fecha_devolucion IN (%s, %s)
                AND p.estado = 'activo'
                ORDER BY p.fecha_devolucion ASC
                LIMIT 5
            """, (hoy, manana))
            por_vencer = await cursor.fetchall()

            return {
                "status": "success",
                "alertas": {
                    "recogen_hoy": recogen_hoy,
                    "por_vencer": por_vencer
                }
            }

        except Exception as e:
            print(f"❌ Error obtener_alertas_bibliotecario: {e}")
            return {"status": "error", "message": str(e)}


async def obtener_datos_grafica_prestamos():
    """Obtiene datos para gráfica de préstamos por mes (últimos 6 meses)"""
    async with get_cursor() as (conn, cursor):
        try:
            await cursor.execute("""
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as mes,
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'devuelto' THEN 1 ELSE 0 END) as devueltos,
                    SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
                    SUM(CASE WHEN estado = 'atrasado' THEN 1 ELSE 0 END) as atrasados,
                    SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as cancelados
                FROM prestamos_fisicos
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY mes DESC
            """)
            
            datos = await cursor.fetchall()
            
            return {
                "status": "success",
                "grafica": datos
            }
            
        except Exception as e:
            print(f"❌ Error obtener_datos_grafica_prestamos: {e}")
            return {"status": "error", "message": str(e)}

async def obtener_libros_populares(tipo: str = "prestamos"):
    """
    Obtiene los libros más populares según el tipo:
    - tipo="prestamos": libros más prestados.
    - tipo="wishlist": libros más guardados en lista de deseos.
    """
    async with get_cursor() as (conn, cursor):
        try:
            if tipo == "wishlist":
                query = """
                    SELECT 
                        l.id,
                        l.titulo,
                        l.autor_id,
                        a.nombre AS autor,
                        COUNT(w.libro_id) AS total
                    FROM wishlist w
                    JOIN libros l ON w.libro_id = l.id
                    LEFT JOIN autores a ON l.autor_id = a.id
                    GROUP BY l.id, l.titulo, a.nombre
                    ORDER BY total DESC
                    LIMIT 5
                """
            else:
                query = """
                    SELECT 
                        l.id,
                        l.titulo,
                        l.autor_id,
                        a.nombre AS autor,
                        COUNT(p.libro_id) AS total
                    FROM prestamos_fisicos p
                    JOIN libros l ON p.libro_id = l.id
                    LEFT JOIN autores a ON l.autor_id = a.id
                    GROUP BY l.id, l.titulo, a.nombre
                    ORDER BY total DESC
                    LIMIT 5
                """
            
            await cursor.execute(query)
            libros = await cursor.fetchall()

            return {"status": "success", "libros": libros}
        except Exception as e:
            print(f"❌ Error obtener_libros_populares: {e}")
            return {"status": "error", "message": str(e)}
