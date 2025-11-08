# En prestamos_schema.py - SIMPLIFICADO
from pydantic import BaseModel

class PrestamoFisicoRequest(BaseModel):
    libro_id: int
    fecha_recogida: str  # Formato: YYYY-MM-DD

class EstadoRequest(BaseModel):
    estado: str