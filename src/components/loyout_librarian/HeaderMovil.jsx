import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import logo from "../../assets/img/aeternum_logo.png";

const HeaderMovil = ({ usuario }) => { 
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false); // ✅ NUEVO
  const navigate = useNavigate();
  const location = useLocation(); 

  // ✅ NUEVO: Detectar scroll para mostrar/ocultar botón
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ NUEVO: Función para scroll suave hacia arriba
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/");
  };
  
  const isActive = (path) => {
    return location.pathname.includes(path);
  };
  
  const isHomeActive = location.pathname === "/loyout_librarian/dashboard_librarian";

  return (
    <>
      {/* Header superior */}
      <header className="header header-movil" id="navbar">
        <div
          className="header-content"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
          }}
        >
          <img
            src={logo}
            alt="Aeternum Logo"
            className="logo"
            style={{ height: "40px", cursor: "pointer", objectFit: "contain", }}
            onClick={() => navigate("/loyout_librarian/dashboard_librarian")}
          />

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#333",
            }}
          >
            <i className={`bx ${menuOpen ? "bx-x" : "bx-user"} text-3xl`}></i>
          </button>
        </div>

        {/* Menú desplegable */}
        {menuOpen && (
          <ul
            className="dropdown active"
            style={{
              position: "absolute",
              top: "60px",
              right: "10px",
              background: "#fff",
              boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
              borderRadius: "10px",
              padding: "8px 0",
              width: "180px",
              zIndex: 999,
            }}
          >
            {usuario && ( 
              <li
                style={{
                  listStyle: "none",
                  padding: "10px 16px",
                  borderBottom: "1px solid #eee",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                <i className="bx bx-user"></i> {usuario.nombre} {usuario.apellido}
              </li>
            )}

            <li
              style={{
                listStyle: "none",
                padding: "10px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={() => {
                setMenuOpen(false);
                navigate("/loyout_librarian/perfil_library");
              }}
            >
              <i className="bx bx-user"></i> Perfil
            </li>
            <li
              style={{
                listStyle: "none",
                padding: "10px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
            >
              <i className="bx bx-log-out"></i> Cerrar sesión
            </li>
          </ul>
        )}
      </header>

      {/* 🆕 BOTÓN SCROLL TO TOP */}
{showScrollTop && (
  <button
    className="scroll-to-top-btn"
    onClick={scrollToTop}
    style={{
      position: "fixed",
      bottom: "100px",
      right: "20px",
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #b150a8 0%, #8e3d85 100%)", // ✅ NUEVO COLOR
      border: "none",
      boxShadow: "0 4px 12px rgba(177, 80, 168, 0.4)", // ✅ NUEVO COLOR
      cursor: "pointer",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: "24px",
      animation: "fadeInUp 0.3s ease",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "scale(1.1) translateY(-3px)";
      e.currentTarget.style.boxShadow = "0 6px 18px rgba(177, 80, 168, 0.6)"; // ✅ NUEVO COLOR
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "scale(1) translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(177, 80, 168, 0.4)"; // ✅ NUEVO COLOR
    }}
  >
    <i className="bx bx-up-arrow-alt"></i>
  </button>
)}

      {/* Barra inferior de navegación */}
      <nav className="bottom-nav dashboard-nav">
        <Link
          to="/loyout_librarian/dashboard_librarian"
          className={`nav-item ${isHomeActive ? "active" : ""}`}
        >
          <i className="bx bx-home"></i>
          <span>Inicio</span>
        </Link>

        <Link 
          to="/loyout_librarian/Usuarios" 
          className={`nav-item ${isActive("/Usuarios") ? "active" : ""}`}
        >
          <i className="bx bx-user"></i>
          <span>Usuarios</span>
        </Link>

        <Link 
          to="/loyout_librarian/libros" 
          className={`nav-item ${isActive("/libros") ? "active" : ""}`}
        >
          <i className="bx bx-book"></i>
          <span>Libros</span>
        </Link>

        <Link 
          to="/loyout_librarian/prestamos" 
          className={`nav-item ${isActive("/prestamos") ? "active" : ""}`} 
        >
          <i className="bx bx-book-bookmark"></i>
          <span>Préstamos</span>
        </Link>
      </nav>

      {/* Estilos para la animación */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default HeaderMovil;