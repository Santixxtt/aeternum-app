import { useState, useEffect } from 'react';
import '../../assets/css/dashboard_librarian.css';

const Alertas = () => {
  const [alertas, setAlertas] = useState({
    recogen_hoy: [],
    por_vencer: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://10.17.0.32:8000/estadisticas/bibliotecario/alertas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar alertas');

      const data = await response.json();
      setAlertas(data.alertas);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Formateo corregido sin desfase
  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-CO', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="alertas-section loading">⏳ Cargando alertas...</div>;
  }

  if (error) {
    return (
      <div className="alertas-section error">
        ❌ {error}
        <button className="btn-retry" onClick={cargarAlertas}>🔄 Reintentar</button>
      </div>
    );
  }

  const totalAlertas = alertas.recogen_hoy.length + alertas.por_vencer.length;

  return (
    <div className="alertas-section">
      <div className="seccion-header">
        <h2>Alertas y Notificaciones</h2>
        <span className="badge-total">
          {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>

      <div className="alertas-grid">
        {/* Préstamos para Recoger Hoy */}
        <div className="alerta-card alerta-recogen-hoy">
          <div className="alerta-header">
            <h3>Libros para Recoger Hoy</h3>
            <span className="badge-count">{alertas.recogen_hoy.length}</span>
          </div>
          
          {alertas.recogen_hoy.length === 0 ? (
            <p className="no-alertas">No hay libros programados para recoger hoy</p>
          ) : (
            <div className="alertas-lista">
              {alertas.recogen_hoy.map((prestamo) => (
                <div key={prestamo.id} className="alerta-item">
                  <div className="alerta-info">
                    <strong>{prestamo.titulo}</strong>
                    <small>{prestamo.nombre} {prestamo.apellido}</small>
                  </div>
                  <div className="alerta-fecha">
                    <span className="fecha-recogida">
                      Recoge: {formatearFecha(prestamo.fecha_recogida)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Préstamos por Vencer */}
        <div className="alerta-card alerta-por-vencer">
          <div className="alerta-header">
            <h3>Próximos a Vencer</h3>
            <span className="badge-count">{alertas.por_vencer.length}</span>
          </div>
          
          {alertas.por_vencer.length === 0 ? (
            <p className="no-alertas"> No hay préstamos por vencer hoy o mañana</p>
          ) : (
            <div className="alertas-lista">
              {alertas.por_vencer.map((prestamo) => (
                <div key={prestamo.id} className="alerta-item">
                  <div className="alerta-info">
                    <strong>{prestamo.titulo}</strong>
                    <small>{prestamo.nombre} {prestamo.apellido}</small>
                  </div>
                  <div className="alerta-fecha">
                    <span className="fecha-vencimiento">
                      Vence: {formatearFecha(prestamo.fecha_devolucion)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button className="btn-refresh" onClick={cargarAlertas}>
        <i className='bx bx-refresh-ccw'></i>  Actualizar Alertas
      </button>
    </div>
  );
};

export default Alertas;
