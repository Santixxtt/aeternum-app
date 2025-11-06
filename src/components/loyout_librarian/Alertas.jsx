import { useState, useEffect } from 'react';
import '../../assets/css/dashboard_librarian.css';

const Alertas = () => {
  const [alertas, setAlertas] = useState({
    atrasados: [],
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
      
      const response = await fetch('http://localhost:8000/estadisticas/bibliotecario/alertas', {
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

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CO');
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

  const totalAlertas = alertas.atrasados.length + alertas.por_vencer.length;

  return (
    <div className="alertas-section">
      <div className="seccion-header">
        <h2>Alertas y Notificaciones</h2>
        <span className="badge-total">
          {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>

      <div className="alertas-grid">
        {/* Préstamos Atrasados */}
        <div className="alerta-card alerta-atrasados">
          <div className="alerta-header">
            <h3>Préstamos Atrasados</h3>
            <span className="badge-count">{alertas.atrasados.length}</span>
          </div>
          
          {alertas.atrasados.length === 0 ? (
            <p className="no-alertas"> No hay préstamos atrasados</p>
          ) : (
            <div className="alertas-lista">
              {alertas.atrasados.map((prestamo) => (
                <div key={prestamo.id} className="alerta-item">
                  <div className="alerta-info">
                    <strong>{prestamo.titulo}</strong>
                    <small>{prestamo.nombre} {prestamo.apellido}</small>
                  </div>
                  <div className="alerta-dias">
                    <span className="dias-atraso">
                      {prestamo.dias_atraso} {prestamo.dias_atraso === 1 ? 'día' : 'días'} de atraso
                    </span>
                    <small>Vencía: {formatearFecha(prestamo.fecha_devolucion)}</small>
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
        <i class='bxr  bx-refresh-ccw'    ></i>  Actualizar Alertas
      </button>
    </div>
  );
};

export default Alertas;