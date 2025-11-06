from pydantic import BaseModel

class PrestamoFisicoRequest(BaseModel):
    libro_id: int
    openlibrary_key: str
    titulo: str
    autor: str
    fecha_recogida: str 

class EstadoRequest(BaseModel):
    estado: str
