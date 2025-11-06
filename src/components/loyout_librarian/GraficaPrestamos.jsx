import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../assets/css/dashboard_librarian.css';

const GraficaPrestamos = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/estadisticas/bibliotecario/grafica-prestamos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar datos de gráfica');

      const data = await response.json();
      
      // Formatear datos para la gráfica (invertir orden para mostrar más reciente primero)
      const datosFormateados = data.grafica.reverse().map(item => ({
        mes: formatearMes(item.mes),
        Total: item.total,
        Devueltos: item.devueltos,
        Activos: item.activos,
        Atrasados: item.atrasados,
        Cancelados: item.cancelados
      }));

      setDatos(datosFormateados);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatearMes = (mesAno) => {
    const [ano, mes] = mesAno.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  };

  if (loading) {
    return <div className="grafica-prestamos loading">⏳ Cargando gráfica...</div>;
  }

  if (error) {
    return (
      <div className="grafica-prestamos error">
        ❌ {error}
        <button className="btn-retry" onClick={cargarDatos}>🔄 Reintentar</button>
      </div>
    );
  }

  return (
    <div className="grafica-prestamos">
      <div className="seccion-header">
        <h2>Estadísticas de Préstamos (Últimos 6 meses)</h2>
        <button className="btn-refresh-small" onClick={cargarDatos}><i class='bxr  bx-refresh-ccw'    ></i> </button>
      </div>

      {datos.length === 0 ? (
        <p className="no-data">No hay datos suficientes para mostrar la gráfica</p>
      ) : (
        <>
          <div className="grafica-container">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={datos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '10px'
                  }}
                />
                <Legend />
                <Bar dataKey="Devueltos" fill="#27ae60" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Activos" fill="#3498db" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Atrasados" fill="#e74c3c" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Cancelados" fill="#95a5a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grafica-leyenda">
            <div className="leyenda-item">
              <span className="leyenda-color" style={{ background: '#27ae60' }}></span>
            </div>
            <div className="leyenda-item">
              <span className="leyenda-color" style={{ background: '#3498db' }}></span>
            </div>
            <div className="leyenda-item">
              <span className="leyenda-color" style={{ background: '#e74c3c' }}></span>
            </div>
            <div className="leyenda-item">
              <span className="leyenda-color" style={{ background: '#95a5a6' }}></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GraficaPrestamos;