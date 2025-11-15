from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.task.verificar_mora import verificar_y_bloquear_usuarios_con_mora

scheduler = AsyncIOScheduler()

def start_scheduler():
    """Inicia el scheduler de tareas automáticas"""
    
    # Ejecutar verificación diaria a las 2:00 AM
    scheduler.add_job(
        verificar_y_bloquear_usuarios_con_mora,
        'cron',
        hour=2,
        minute=0,
        id='verificar_mora_diaria'
    )
    
    scheduler.start()
    print("Scheduler iniciado: Verificación de mora a las 2:00 AM")

def stop_scheduler():
    """Detiene el scheduler"""
    scheduler.shutdown()
    print("Scheduler detenido")