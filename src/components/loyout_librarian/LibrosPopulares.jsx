import { useState, useEffect } from "react";
import "../../assets/css/dashboard_librarian.css";

const LibrosPopulares = ({ tipo = "prestamos" }) => {
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const titulo =
    tipo === "wishlist" ? "Libros Más Guardados en Wishlist" : "Libros Más Prestados";

  useEffect(() => {
    cargarLibrosPopulares();
  }, [tipo]);

  const cargarLibrosPopulares = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://10.17.0.26:8000/estadisticas/bibliotecario/libros-populares?tipo=${tipo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Error al cargar libros populares");

      const data = await res.json();
      setLibros(data.libros);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="prestamos-recientes loading">⏳ Cargando {titulo}...</div>;

  if (error)
    return (
      <div className="prestamos-recientes error">
        ❌ {error}
        <button className="btn-retry" onClick={cargarLibrosPopulares}>
          <i className="bx bx-refresh"></i> Reintentar
        </button>
      </div>
    );

  return (
    <div className="prestamos-recientes">
      <div className="seccion-header">
        <h2>{titulo}</h2>
        <button className="btn-refresh-small" onClick={cargarLibrosPopulares}>
          <i className="bx bx-refresh"></i>
        </button>
      </div>

      {libros.length === 0 ? (
        <p className="no-data">No hay datos disponibles</p>
      ) : (
        <div className="tabla-container">
          <table className="tabla-prestamos">
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Autor</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {libros.map((libro, i) => (
                <tr key={libro.id}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="libro-info">
                      <strong>{libro.titulo}</strong>
                    </div>
                  </td>
                  <td>{libro.autor || "Desconocido"}</td>
                  <td>
                    <span className="badge-estado estado-activo">
                      {libro.total}
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

export default LibrosPopulares;
