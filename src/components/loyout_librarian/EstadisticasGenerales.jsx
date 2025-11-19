import { useState, useEffect } from 'react';
import '../../assets/css/dashboard_librarian.css';

const EstadisticasGenerales = () => {
  const [estadisticas, setEstadisticas] = useState({
    total_activos: 0,
    pendientes_aprobar: 0,
    para_recoger_hoy: 0,
    vencidos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const token = localStorage.getItem('token'); 
      
      
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor inicia sesión.');
      }
      
      const url = 'http://10.17.0.28:8000/estadisticas/bibliotecario/generales';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        const errorDetail = await response.json();
        console.log('❌ Error 401 detalle:', errorDetail);
        localStorage.removeItem('token');
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar estadísticas');
      }

      const data = await response.json();
      
      setEstadisticas(data.estadisticas);
    } catch (err) {
      setError(err.message);
      console.error('❌ Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="estadisticas-generales">
        <div className="loading">⏳ Cargando estadísticas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="estadisticas-generales">
        <div className="error">
          ❌ {error}
          <button 
            className="btn-refresh" 
            onClick={cargarEstadisticas}
            style={{ marginTop: '10px' }}
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="estadisticas-generales">
      <h2 className="seccion-titulo">Estadísticas Generales</h2>
      
      <div className="stats-grid">
  <div className="stat-card stat-activos">
    <div className="stat-icon"><i class='bxs bx-book-library'></i></div>
    <div className="stat-content">
      <div className="stat-numero">{estadisticas.total_activos}</div>
      <div className="stat-label">Préstamos Activos</div>
    </div>
  </div>

  <div className="stat-card stat-pendientes">
    <div className="stat-icon"><i class='bxs bx-alarm-alt'></i></div>
    <div className="stat-content">
      <div className="stat-numero">{estadisticas.pendientes_aprobar}</div>
      <div className="stat-label">Pendientes de Aprobar</div>
    </div>
  </div>

  <div className="stat-card stat-recoger">
    <div className="stat-icon"><i class='bxs bx-calendar-detail'></i></div>
    <div className="stat-content">
      <div className="stat-numero">{estadisticas.para_recoger_hoy}</div>
      <div className="stat-label">Para Recoger Hoy</div>
    </div>
  </div>

  <div className="stat-card stat-vencidos">
    <div className="stat-icon"><i class='bxs bx-badge-exclamation'></i></div>
    <div className="stat-content">
      <div className="stat-numero">{estadisticas.vencidos}</div>
      <div className="stat-label">Préstamos Vencidos</div>
    </div>
  </div>
</div>


      <button className="btn-refresh" onClick={cargarEstadisticas}>
        <i class='bxr  bx-refresh-ccw'    ></i>  Actualizar
      </button>
    </div>
  );
};

export default EstadisticasGenerales;