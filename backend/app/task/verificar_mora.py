from datetime import datetime, timedelta
import pytz
from app.config.database import get_cursor
from app.utils.email_mora import send_cuenta_bloqueada_mora

async def verificar_y_bloquear_usuarios_con_mora():
    """
    Verifica préstamos vencidos y bloquea cuentas automáticamente
    Debe ejecutarse diariamente (cron o scheduler)
    """
    
    tz = pytz.timezone("America/Bogota")
    hoy = datetime.now(tz).date()
    
    print(f"🔍 Verificando mora de usuarios - {hoy}")
    
    async with get_cursor() as (conn, cursor):
        # 1️⃣ Obtener usuarios con préstamos vencidos
        await cursor.execute("""
            SELECT 
                u.id as usuario_id,
                u.nombre,
                u.apellido,
                u.correo,
                u.estado as estado_actual,
                COUNT(DISTINCT pf.id) as total_vencidos,
                MIN(pf.fecha_devolucion) as fecha_mas_antigua
            FROM usuarios u
            INNER JOIN prestamos_fisicos pf ON u.id = pf.usuario_id
            WHERE pf.estado = 'activo'
            AND pf.fecha_devolucion < %s
            GROUP BY u.id
            HAVING u.estado != 'Bloqueado'
        """, (hoy,))
        
        usuarios_morosos = await cursor.fetchall()
        
        if not usuarios_morosos:
            print("✅ No hay usuarios con préstamos vencidos")
            return {"status": "success", "bloqueados": 0}
        
        bloqueados = 0
        
        for usuario in usuarios_morosos:
            usuario_id = usuario['usuario_id']
            nombre_completo = f"{usuario['nombre']} {usuario['apellido']}"
            
            # Calcular días de mora
            fecha_mas_antigua = usuario['fecha_mas_antigua']
            dias_mora = (hoy - fecha_mas_antigua).days
            
            # 2️⃣ Obtener lista de libros vencidos del usuario
            await cursor.execute("""
                SELECT 
                    l.titulo,
                    DATE_FORMAT(pf.fecha_devolucion, '%%d/%%m/%%Y') as fecha_devolucion
                FROM prestamos_fisicos pf
                INNER JOIN libros l ON pf.libro_id = l.id
                WHERE pf.usuario_id = %s
                AND pf.estado = 'activo'
                AND pf.fecha_devolucion < %s
                ORDER BY pf.fecha_devolucion ASC
            """, (usuario_id, hoy))
            
            libros_vencidos = await cursor.fetchall()
            
            # 3️⃣ Bloquear cuenta del usuario
            await cursor.execute("""
                UPDATE usuarios 
                SET estado = 'Bloqueado',
                    motivo_bloqueo = %s,
                    fecha_bloqueo = %s
                WHERE id = %s
            """, (
                f"Préstamos vencidos: {usuario['total_vencidos']} libro(s) - Mora de {dias_mora} día(s)",
                datetime.now(tz),
                usuario_id
            ))
            
            await conn.commit()
            
            print(f"🔒 Usuario bloqueado: {nombre_completo} (ID: {usuario_id})")
            
            # 4️⃣ Enviar correo de notificación
            try:
                await send_cuenta_bloqueada_mora(
                    recipient_email=usuario['correo'],
                    nombre_usuario=nombre_completo,
                    libros_vencidos=libros_vencidos,
                    dias_mora=dias_mora
                )
            except Exception as e:
                print(f"⚠️ Error enviando correo a {usuario['correo']}: {e}")
            
            bloqueados += 1
        
        print(f"✅ Proceso completado: {bloqueados} usuario(s) bloqueado(s)")
        
        return {
            "status": "success",
            "bloqueados": bloqueados,
            "fecha_verificacion": hoy.isoformat()
        }