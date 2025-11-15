import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import logo from "../../assets/img/aeternum_logo.png";

const HeaderMovil = ({ onLogout, onSearch, usuario }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
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
    if (onLogout) onLogout();
    navigate("/");
  };
  
  const isActive = (path) => {
    if (path === "/loyout_user/dashboard_user") {
      return location.pathname === path;
    }
    return location.pathname.includes(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query);
      setSearchOpen(false);
    }
  };

  const handleQueryChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.length === 0 && onSearch) {
      onSearch("");
    }
  };

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
            style={{ 
              height: "40px", 
              cursor: "pointer", 
              objectFit: "contain" 
            }}
            onClick={() => navigate("/loyout_user/dashboard_user")}
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

        {/* Barra de búsqueda desplegable */}
        {searchOpen && (
          <form
            onSubmit={handleSearch}
            style={{
              padding: "0.5rem 1.25rem 1rem",
              background: "#fff",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <div style={{ 
              display: "flex", 
              gap: "8px",
              background: "#f5f5f5",
              borderRadius: "8px",
              padding: "8px"
            }}>
              <input
                type="text"
                placeholder="Buscar libros..."
                value={query}
                onChange={handleQueryChange}
                autoFocus
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#4a90e2",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                <i className="bx bx-search"></i>
              </button>
            </div>
          </form>
        )}

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
                navigate("/loyout_user/perfil");
              }}
            >
              <i className="bx bx-face"></i> Perfil
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

      {/* 🔍 Botón flotante de búsqueda */}
      <button
        className="floating-search-btn"
        onClick={() => setSearchOpen(!searchOpen)}
        style={{
          position: "fixed",
          bottom: "40px", 
          left: "50%",
          transform: "translateX(-50%)",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #B6407D 0%, #d5519d 100%)",
          border: "none",
          boxShadow: "0 4px 15px rgba(182, 64, 125, 0.4)",
          cursor: "pointer",
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          color: "#fff",
          fontSize: "24px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateX(-50%) scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(182, 64, 125, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateX(-50%) scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 15px rgba(182, 64, 125, 0.4)";
        }}
      >
        <i className={`bx ${searchOpen ? "bx-x" : "bx-search"}`}></i>
      </button>

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
          to="/loyout_user/dashboard_user"
          className={`nav-item ${isActive("/loyout_user/dashboard_user") ? "active" : ""}`}
        >
          <i className="bx bx-home"></i>
          <span>Inicio</span>
        </Link>

        <Link 
          to="/catalogo" 
          className={`nav-item ${isActive("/catalogo") ? "active" : ""}`}
        >
          <i className="bx bx-book"></i>
          <span>Catálogo</span>
        </Link>

        <div style={{ flex: 1 }}></div>

        <Link 
          to="/loyout_user/lista_deseos" 
          className={`nav-item ${isActive("/loyout_user/lista_deseos") ? "active" : ""}`} 
        >
          <i className="bx bx-star"></i>
          <span>Deseos</span>
        </Link>

        <Link 
          to="/loyout_user/mis_prestamos" 
          className={`nav-item ${isActive("/loyout_user/mis_prestamos") ? "active" : ""}`} 
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