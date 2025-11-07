import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../../assets/css/prestamos_bibliotecario.css";
import Header from "./header";
import HeaderMovil from "./HeaderMovil";
import Footer from "../loyout_reusable/footer";

const Prestamos = () => {
  const [prestamosFisicos, setPrestamosFisicos] = useState([]);
  const [prestamosDigitales, setPrestamosDigitales] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [graficaData, setGraficaData] = useState([]);
  const [librosPopulares, setLibrosPopulares] = useState([]);
  const [librosDigitalesPopulares, setLibrosDigitalesPopulares] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [fechaFiltro, setFechaFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("fisicos");
  const [processingId, setProcessingId] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const API_BASE = `${API_URL}`;
  const PRESTAMOS_BASE = `${API_BASE}/prestamos-fisicos`;
  const STATS_BASE = `${API_BASE}/estadisticas/bibliotecario`;

  const getToken = () =>
    localStorage.getItem("token") || localStorage.getItem("access_token") || "";

  useEffect(() => {
    fetchPrestamosFisicos();
    fetchPrestamosDigitales();
    fetchEstadisticas();
    fetchGraficaData();
    fetchLibrosPopulares();
    fetchLibrosDigitalesPopulares();
  }, []);

  // ✅ Obtener préstamos físicos
  const fetchPrestamosFisicos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${STATS_BASE}/prestamos-recientes?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();

      setPrestamosFisicos(json.prestamos || []);
    } catch (err) {
      console.error("Error fetchPrestamosFisicos:", err);
      setPrestamosFisicos([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Obtener préstamos digitales
  const fetchPrestamosDigitales = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/prestamos/all-digital`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();

      setPrestamosDigitales(json.prestamos || []);
    } catch (err) {
      console.error("Error fetchPrestamosDigitales:", err);
      setPrestamosDigitales([]);
    }
  };

  // ✅ Obtener libros digitales populares
  const fetchLibrosDigitalesPopulares = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/prestamos/digitales-populares?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();

      setLibrosDigitalesPopulares(json.libros || []);
    } catch (err) {
      console.error("Error fetchLibrosDigitalesPopulares:", err);
    }
  };

  // ✅ Obtener estadísticas generales
  const fetchEstadisticas = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${STATS_BASE}/generales`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();

      setEstadisticas(json.estadisticas || null);
    } catch (err) {
      console.error("Error fetchEstadisticas:", err);
    }
  };

  // ✅ Obtener datos para gráfica
  const fetchGraficaData = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${STATS_BASE}/grafica-prestamos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();

      setGraficaData(json.grafica || []);
    } catch (err) {
      console.error("Error fetchGraficaData:", err);
    }
  };

  // ✅ Obtener libros populares
  const fetchLibrosPopulares = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${STATS_BASE}/libros-populares?tipo=prestamos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();

      setLibrosPopulares(json.libros || []);
    } catch (err) {
      console.error("Error fetchLibrosPopulares:", err);
    }
  };

  // ✅ Cambiar estado de préstamo
  const handleChangeStatus = async (prestamo, nuevoEstado) => {
    if (!window.confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;

    setProcessingId(prestamo.id);

    // Cambio optimista
    setPrestamosFisicos((prev) =>
      prev.map((p) => (p.id === prestamo.id ? { ...p, estado: nuevoEstado } : p))
    );

    try {
      const token = getToken();
      const res = await fetch(`${PRESTAMOS_BASE}/estado/${prestamo.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) {
        // Revertir si falla
        setPrestamosFisicos((prev) =>
          prev.map((p) => (p.id === prestamo.id ? { ...p, estado: prestamo.estado } : p))
        );
        throw new Error(`Error ${res.status}`);
      }

      showNotification(`Estado actualizado a "${nuevoEstado}"`, "success");
      fetchEstadisticas();
    } catch (err) {
      console.error("Error handleChangeStatus:", err);
      alert("Error al cambiar estado: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Notificación toast
  const showNotification = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  // ✅ Fecha actual YYYY-MM-DD
  const getToday = () => new Date().toISOString().split("T")[0];

  // ✅ Filtro combinando búsqueda / estado / fecha
  const filteredPrestamos = prestamosFisicos.filter((p) => {
    const coincideBusqueda = `${p.titulo || ""} ${p.nombre || ""} ${p.apellido || ""} ${p.correo || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const coincideEstado =
      estadoFiltro === "todos" ||
      (p.estado && p.estado.toLowerCase() === estadoFiltro.toLowerCase());

    const hoy = getToday();
    let coincideFecha = true;

    if (fechaFiltro === "hoy_recoger") {
      coincideFecha = p.fecha_recogida === hoy && p.estado === "activo";
    } else if (fechaFiltro === "hoy_devolver") {
      coincideFecha = p.fecha_devolucion === hoy && p.estado === "activo";
    } else if (fechaFiltro === "vencidos") {
      coincideFecha = p.fecha_devolucion < hoy && (p.estado === "activo" || p.estado === "atrasado");
    }

    return coincideBusqueda && coincideEstado && coincideFecha;
  });

  const filteredDigitales = prestamosDigitales.filter((p) => {
    const coincideBusqueda = `${p.titulo || ""} ${p.usuario_nombre || ""} ${p.usuario_apellido || ""} ${p.usuario_correo || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    return coincideBusqueda;
  });

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: "#ff9800",
      activo: "#4caf50",
      devuelto: "#2196f3",
      atrasado: "#f44336",
      cancelado: "#9e9e9e",
      finalizado: "#2196f3",
    };
    return colores[estado] || "#9e9e9e";
  };

  const getPieData = () => {
    const estados = {
      pendiente: 0,
      activo: 0,
      devuelto: 0,
      atrasado: 0,
      cancelado: 0,
    };

    prestamosFisicos.forEach((p) => {
      if (estados[p.estado] !== undefined) {
        estados[p.estado]++;
      }
    });

    return Object.entries(estados).map(([estado, cantidad]) => ({
      name: estado.charAt(0).toUpperCase() + estado.slice(1),
      value: cantidad,
      color: getEstadoColor(estado),
    }));
  };

  const [isMobile, setIsMobile] = useState(false);
        useEffect(() => {
          const checkDevice = () => {
            const mobile =
              /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
              window.innerWidth < 768;
            setIsMobile(mobile);
          };
          checkDevice();
          window.addEventListener("resize", checkDevice);
          return () => window.removeEventListener("resize", checkDevice);
        }, []);

  return (
    <>
      {isMobile ? <HeaderMovil /> : <Header />}
      <div className="prestamos-container">
        <div className="prestamos-header">
          <h2>Gestión de Préstamos</h2>

          <div className="prestamos-tabs">
            <button
              className={`tab-btn ${activeTab === "fisicos" ? "active" : ""}`}
              onClick={() => setActiveTab("fisicos")}
            >
              <i className="bx bx-book"></i> Físicos
            </button>
            <button
              className={`tab-btn ${activeTab === "digitales" ? "active" : ""}`}
              onClick={() => setActiveTab("digitales")}
            >
              <i className="bx bx-laptop"></i> Digitales
            </button>
            <button
              className={`tab-btn ${activeTab === "estadisticas" ? "active" : ""}`}
              onClick={() => setActiveTab("estadisticas")}
            >
              <i className="bx bx-bar-chart-alt-2"></i> Estadísticas
            </button>
          </div>
        </div>

        {/* TAB: FÍSICOS */}
        {activeTab === "fisicos" && (
          <>
            {estadisticas && (
              <div className="stats-cards">
                <div className="stat-card pending">
                  <i className="bx bx-time-five"></i>
                  <div>
                    <h3>{estadisticas.pendientes_aprobar}</h3>
                    <p>Pendientes</p>
                  </div>
                </div>
                <div className="stat-card active">
                  <i className="bx bx-book-open"></i>
                  <div>
                    <h3>{estadisticas.total_activos}</h3>
                    <p>Activos</p>
                  </div>
                </div>
                <div className="stat-card pickup">
                  <i className="bx bx-calendar-check"></i>
                  <div>
                    <h3>{estadisticas.para_recoger_hoy}</h3>
                    <p>Para hoy</p>
                  </div>
                </div>
                <div className="stat-card overdue">
                  <i className="bx bx-error"></i>
                  <div>
                    <h3>{estadisticas.vencidos}</h3>
                    <p>Vencidos</p>
                  </div>
                </div>
              </div>
            )}

            <div className="prestamos-actions">
              <div className="filtros-container">
                <div className="prestamos-search">
                  <FaSearch className="prestamos-search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar préstamo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                <select
                  className="filtro-select"
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                >
                  <option value="todos">📋 Todos los estados</option>
                  <option value="pendiente">⏳ Pendiente</option>
                  <option value="activo">✅ Activo</option>
                  <option value="devuelto">📘 Devuelto</option>
                  <option value="atrasado">⚠️ Atrasado</option>
                  <option value="cancelado">❌ Cancelado</option>
                </select>

                <select
                  className="filtro-select"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                >
                  <option value="todos">📅 Todas las fechas</option>
                  <option value="hoy_recoger">🎯 Para recoger hoy</option>
                  <option value="hoy_devolver">📆 Para devolver hoy</option>
                  <option value="vencidos">⏰ Vencidos</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="prestamos-loading">Cargando préstamos...</p>
            ) : (
              <div className="prestamos-table-wrapper">
                <table className="prestamos-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Libro</th>
                      <th>Autor</th>
                      <th>Recogida</th>
                      <th>Devolución</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrestamos.length > 0 ? (
                      filteredPrestamos.map((p) => (
                        <tr key={p.id} className={processingId === p.id ? "processing" : ""}>
                          <td>{p.id}</td>
                          <td>
                            <div className="user-info">
                              <strong>
                                {p.nombre} {p.apellido}
                              </strong>
                              <small>{p.correo}</small>
                            </div>
                          </td>
                          <td>{p.titulo}</td>
                          <td>{p.autor || "-"}</td>
                          <td>{p.fecha_recogida}</td>
                          <td>{p.fecha_devolucion}</td>
                          <td>
                            <span
                              className={`prestamo-estado ${p.estado}`}
                              style={{ backgroundColor: getEstadoColor(p.estado) }}
                            >
                              {p.estado}
                            </span>
                          </td>
                          <td className="prestamos-actions-cell">
                            {processingId === p.id ? (
                              <i className="bx bx-loader-alt bx-spin"></i>
                            ) : (
                              <select
                                value={p.estado}
                                onChange={(e) => handleChangeStatus(p, e.target.value)}
                                className="estado-select-small"
                                disabled={p.estado === "devuelto" || p.estado === "cancelado"}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="activo">Activo</option>
                                <option value="atrasado">Atrasado</option>
                                <option value="devuelto">Devuelto</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="prestamos-empty">
                          No hay préstamos que coincidan con los filtros.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB: DIGITALES */}
        {activeTab === "digitales" && (
          <>
            <div className="prestamos-actions">
              <div className="filtros-container">
                <div className="prestamos-search">
                  <FaSearch className="prestamos-search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar préstamo digital..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="prestamos-table-wrapper">
              <table className="prestamos-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Libro</th>
                    <th>Autor</th>
                    <th>Fecha Préstamo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDigitales.length > 0 ? (
                    filteredDigitales.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>
                          <div className="user-info">
                            <strong>
                              {p.usuario_nombre} {p.usuario_apellido}
                            </strong>
                            <small>{p.usuario_correo}</small>
                          </div>
                        </td>
                        <td>{p.titulo}</td>
                        <td>
                          {p.autor_nombre && p.autor_apellido
                            ? `${p.autor_nombre} ${p.autor_apellido}`
                            : "-"}
                        </td>
                        <td>
                          {p.fecha_prestamo
                            ? new Date(p.fecha_prestamo).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="prestamos-empty">
                        No hay préstamos digitales registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB: ESTADÍSTICAS */}
        {activeTab === "estadisticas" && (
          <div className="estadisticas-container">
            <div className="chart-card">
              <h3>Préstamos por mes (últimos 6 meses)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={graficaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#b150a8" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="devueltos" stroke="#4caf50" name="Devueltos" />
                  <Line type="monotone" dataKey="activos" stroke="#2196f3" name="Activos" />
                  <Line type="monotone" dataKey="atrasados" stroke="#f44336" name="Atrasados" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="charts-row">
              <div className="chart-card half">
                <h3>Distribución por estado (Físicos)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card half">
                <h3>Libros más prestados</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={librosPopulares}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="titulo" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#b150a8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Prestamos;
