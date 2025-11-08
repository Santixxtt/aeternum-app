    import { useState, useEffect } from "react";
    import { useNavigate } from "react-router-dom";
    import Header from "./header";
    import HeaderMovil from "../loyout_user/HeaderMovil";
    import Footer from "../loyout_reusable/footer";
    import defaultImage from "../../assets/img/book-placeholder.png";
    import "../../assets/css/dashboard_user.css";
    import "../../assets/css/prestamos.css";

    export default function Prestamos({ isMobile }) {
        const navigate = useNavigate();
        const [usuario, setUsuario] = useState(null);
        const [prestamos, setPrestamos] = useState([]);
        const [loading, setLoading] = useState(true);
        const [filtroActivo, setFiltroActivo] = useState("todos");
        const [loadingCancelar, setLoadingCancelar] = useState(null);

        useEffect(() => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
            }
        }, [navigate]);

        const cargarDatosUsuario = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await fetch("http://192.168.1.2:8000/users/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    localStorage.removeItem("token");
                    navigate("/");
                    return;
                }

                const data = await res.json();
                setUsuario(data);
            } catch (error) {
                console.error("Error al cargar datos del usuario:", error);
            }
        };

        const cargarPrestamos = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    // ✅ Agregar timestamp para evitar caché del navegador
    const timestamp = new Date().getTime();
    const res = await fetch(`http://192.168.1.2:8000/prestamos-fisicos/mis-prestamos?_t=${timestamp}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    
    if (data.status === "success") {
      setPrestamos(data.prestamos || []);
      console.log("✅ Préstamos cargados:", data.prestamos);
    }
  } catch (error) {
    console.error("Error al cargar préstamos:", error);
  } finally {
    setLoading(false);
  }
};  

        useEffect(() => {
            cargarDatosUsuario();
            cargarPrestamos();
        }, []);

        const cancelarPrestamo = async (prestamoId) => {
  // 🔒 Prevenir clicks múltiples
  if (loadingCancelar === prestamoId) return;

  if (!window.confirm("¿Seguro que deseas cancelar este préstamo?")) return;

  setLoadingCancelar(prestamoId);

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://192.168.1.2:8000/prestamos-fisicos/cancelar/${prestamoId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    
    if (data.status === "success") {
      showNotification("✅ Préstamo cancelado exitosamente", "success");
      
      // ✅ Recargar préstamos después de cancelar
      await cargarPrestamos();
    } else {
      showNotification(data.detail || "Error al cancelar el préstamo", "error");
    }
  } catch (err) {
    console.error("Error al cancelar préstamo:", err);
    showNotification("Error de conexión al cancelar el préstamo", "error");
  } finally {
    setLoadingCancelar(null);
  }
};

// Agregar esta función para mostrar notificaciones
const showNotification = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = `notification ${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#4caf50" : "#f44336"};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s;
  `;
  document.body.appendChild(toast);

  setTimeout(() => (toast.style.opacity = "1"), 100);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

        const handleLogout = () => {
            localStorage.removeItem("token");
            navigate("/");
        };

        // Filtrar préstamos según el filtro activo
        const prestamosFiltrados = prestamos.filter(p => {
            if (filtroActivo === "todos") return true;
            return p.estado === filtroActivo;
        });

        // Contar préstamos por estado
        const contarPorEstado = (estado) => {
            if (estado === "todos") return prestamos.length;
            return prestamos.filter(p => p.estado === estado).length;
        };

        const getEstadoBadge = (estado) => {
            const badges = {
                pendiente: { class: "badge-pendiente", text: "🟡 Pendiente", icon: "bx-time" },
                activo: { class: "badge-activo", text: "🟢 Activo", icon: "bx-check-circle" },
                atrasado: { class: "badge-atrasado", text: "🔴 Atrasado", icon: "bx-error" },
                devuelto: { class: "badge-devuelto", text: "⚪ Devuelto", icon: "bx-archive" },
                cancelado: { class: "badge-cancelado", text: "⚫ Cancelado", icon: "bx-x-circle" }
            };
            return badges[estado] || badges.pendiente;
        };

        const calcularDiasRestantes = (fechaDevolucion) => {
            const hoy = new Date();
            const fechaDev = new Date(fechaDevolucion);
            const diffTime = fechaDev - hoy;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        };

        if (loading) {
            return (
                <div className="dashboard-user">
                    <Header onSearch={(q) => console.log(q)} onLogout={handleLogout} usuario={usuario}/> 
                    <main>
                        <div className="loading">
                            <i className="bx bx-loader-alt bx-spin"></i>
                            <p>Cargando préstamos...</p>
                        </div>
                    </main>
                    <Footer />
                </div>
            );
        }

        return (
            <div className="dashboard-user">
                {isMobile ? (
                    <HeaderMovil
                        onLogout={handleLogout}
                        usuario={usuario}
                    />
                    ) : (
                    <Header
                        onLogout={handleLogout} 
                        usuario={usuario}
                    />
                )}

                <main>
                    <div className="perfil-container">
                        <section className="prestamos-section">
                            <div className="prestamos-header">
                                <h2>
                                    <i className="bx bx-book-reader"></i> <div className="text-black">Mis Préstamos</div>
                                </h2>
                                <button 
                                    className="btn-refresh"
                                    onClick={() => {
                                        setLoading(true);
                                        cargarPrestamos();
                                    }}
                                    title="Recargar préstamos"
                                >
                                    <i className="bx bx-refresh"></i>
                                </button>
                            </div>

                            {/* Filtros mejorados */}
                            <div className="filtros-container">
                                <button 
                                    className={`filtro-btn ${filtroActivo === "todos" ? "activo" : ""}`}
                                    onClick={() => setFiltroActivo("todos")}
                                >
                                    <i className="bx bx-list-ul"></i>
                                    Todos
                                    <span className="badge-count">{contarPorEstado("todos")}</span>
                                </button>
                                
                                <button 
                                    className={`filtro-btn ${filtroActivo === "pendiente" ? "activo" : ""}`}
                                    onClick={() => setFiltroActivo("pendiente")}
                                >
                                    <i className="bx bx-time"></i>
                                    Pendientes
                                    <span className="badge-count">{contarPorEstado("pendiente")}</span>
                                </button>

                                <button 
                                    className={`filtro-btn ${filtroActivo === "activo" ? "activo" : ""}`}
                                    onClick={() => setFiltroActivo("activo")}
                                >
                                    <i className="bx bx-check-circle"></i>
                                    Activos
                                    <span className="badge-count">{contarPorEstado("activo")}</span>
                                </button>

                                <button 
                                    className={`filtro-btn ${filtroActivo === "atrasado" ? "activo" : ""}`}
                                    onClick={() => setFiltroActivo("atrasado")}
                                >
                                    <i className="bx bx-error"></i>
                                    Atrasados
                                    <span className="badge-count">{contarPorEstado("atrasado")}</span>
                                </button>

                                <button 
                                    className={`filtro-btn ${filtroActivo === "devuelto" ? "activo" : ""}`}
                                    onClick={() => setFiltroActivo("devuelto")}
                                >
                                    <i className="bx bx-archive"></i>
                                    Devueltos
                                    <span className="badge-count">{contarPorEstado("devuelto")}</span>
                                </button>

                                <button 
                                    className={`filtro-btn ${filtroActivo === "cancelado" ? "activo" : ""}`}
                                    onClick={() => setFiltroActivo("cancelado")}
                                >
                                    <i className="bx bx-x-circle"></i>
                                    Cancelados
                                    <span className="badge-count">{contarPorEstado("cancelado")}</span>
                                </button>
                            </div>

                            {prestamosFiltrados.length === 0 ? (
                                <div className="empty-state">
                                    <i className="bx bx-book"></i>
                                    <p>No tienes préstamos en esta categoría</p>
                                    {filtroActivo === "todos" && (
                                        <button
                                            className="cta-button"
                                            onClick={() => navigate("/catalogo")}
                                        >
                                            Explorar Catálogo
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="prestamos-grid">
                                    {prestamosFiltrados.map((prestamo) => {
                                        const badge = getEstadoBadge(prestamo.estado);
                                        const diasRestantes = calcularDiasRestantes(prestamo.fecha_devolucion);
                                        const imageUrl = prestamo.cover_i 
                                            ? `https://covers.openlibrary.org/b/id/${prestamo.cover_i}-M.jpg`
                                            : defaultImage;

                                        return (
                                            <div key={prestamo.id} className="prestamo-card">
                                                <img 
                                                    src={imageUrl} 
                                                    alt={prestamo.titulo}
                                                    onError={(e) => {
                                                        e.target.src = defaultImage;
                                                    }}
                                                />
                                                <div className="prestamo-info">
                                                    <h3>{prestamo.titulo}</h3>
                                                    <p className="autor">{prestamo.autor}</p>
                                                    <div className="prestamo-fechas">
                                                        <p><i className="bx bx-calendar"></i> <strong>Recogida:</strong> {prestamo.fecha_recogida}</p>
                                                        <p><i className="bx bx-calendar-check"></i> <strong>Devolución:</strong> {prestamo.fecha_devolucion}</p>
                                                        
                                                        {prestamo.estado === "activo" && diasRestantes > 0 && (
                                                            <p className="dias-restantes">
                                                                <i className="bx bx-time"></i> 
                                                                <strong>{diasRestantes} día{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''}</strong>
                                                            </p>
                                                        )}
                                                        
                                                        {prestamo.estado === "activo" && diasRestantes <= 0 && (
                                                            <p className="dias-restantes atrasado">
                                                                <i className="bx bx-error"></i> 
                                                                <strong>¡Atrasado!</strong>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="prestamo-actions">
                                                    <span className={`badge-estado ${badge.class}`}>
                                                        <i className={`bx ${badge.icon}`}></i>
                                                        {badge.text}
                                                    </span>
                                                    
                                                    {(prestamo.estado === "pendiente" || prestamo.estado === "activo") && (
                                                        <button 
                                                            className="btn-cancelar-prestamo"
                                                            onClick={() => cancelarPrestamo(prestamo.id)}
                                                            disabled={loadingCancelar === prestamo.id}
                                                        >
                                                            {loadingCancelar === prestamo.id ? (
                                                                <>
                                                                    <i className="bx bx-loader-alt bx-spin"></i>
                                                                    Cancelando...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="bx bx-x-circle"></i>
                                                                    Cancelar Préstamo
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }