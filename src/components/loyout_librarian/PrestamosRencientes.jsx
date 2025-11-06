import { useState, useEffect } from 'react';
import '../../assets/css/dashboard_librarian.css';

const PrestamosRecientes = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPrestamos();
  }, []);

  const cargarPrestamos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/estadisticas/bibliotecario/prestamos-recientes?limit=3', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar préstamos');

      const data = await response.json();
      setPrestamos(data.prestamos);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerClaseEstado = (estado) => {
    const clases = {
      'pendiente': 'estado-pendiente',
      'activo': 'estado-activo',
      'atrasado': 'estado-atrasado',
      'devuelto': 'estado-devuelto',
      'cancelado': 'estado-cancelado'
    };
    return clases[estado] || '';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CO');
  };

  if (loading) {
    return <div className="prestamos-recientes loading">⏳ Cargando préstamos...</div>;
  }

  if (error) {
    return (
      <div className="prestamos-recientes error">
        ❌ {error}
        <button className="btn-retry" onClick={cargarPrestamos}><i class='bxr  bx-refresh-ccw'    ></i>  Reintentar</button>
      </div>
    );
  }

  return (
    <div className="prestamos-recientes">
      <div className="seccion-header">
        <h2>Préstamos Recientes</h2>
        <button className="btn-refresh-small" onClick={cargarPrestamos}><i class='bxr  bx-refresh-ccw'    ></i> </button>
      </div>

      {prestamos.length === 0 ? (
        <p className="no-data">No hay préstamos recientes</p>
      ) : (
        <div className="tabla-container">
          <table className="tabla-prestamos">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Libro</th>
                <th>Fecha Solicitud</th>
                <th>Fecha Recogida</th>
                <th>Fecha Devolución</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {prestamos.map((prestamo) => (
                <tr key={prestamo.id}>
                  <td>#{prestamo.id}</td>
                  <td>
                    <div className="usuario-info">
                      <strong>{prestamo.nombre} {prestamo.apellido}</strong>
                      <small>{prestamo.correo}</small>
                    </div>
                  </td>
                  <td>
                    <div className="libro-info">
                      <strong>{prestamo.titulo}</strong>
                      <small>{prestamo.autor}</small>
                    </div>
                  </td>
                  <td>{formatearFecha(prestamo.fecha_solicitud)}</td>
                  <td>{formatearFecha(prestamo.fecha_recogida)}</td>
                  <td>{formatearFecha(prestamo.fecha_devolucion)}</td>
                  <td>
                    <span className={`badge-estado ${obtenerClaseEstado(prestamo.estado)}`}>
                      {prestamo.estado.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PrestamosRecientes;