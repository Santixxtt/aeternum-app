import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const BottomNav = () => { 
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ✅ Detectar scroll
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

  // ✅ Scroll hacia arriba
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // ✅ Verificar ruta activa
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <nav className="bottom-nav">
        <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
          <i className="bx bx-home"></i>
          <span>Inicio</span>
        </Link>
        <Link to="/catalogo" className={`nav-item ${isActive("/catalogo") ? "active" : ""}`}>
          <i className="bx bx-book"></i>
          <span>Catálogo</span>
        </Link>
        <Link to="/contacto" className={`nav-item ${isActive("/contacto") ? "active" : ""}`}>
          <i className="bx bx-phone"></i>
          <span>Contacto</span>
        </Link>
        <Link to="/login" className={`nav-item ${isActive("/login") ? "active" : ""}`}>
          <i className="bx bx-user"></i>
          <span>Ingreso</span>
        </Link>
      </nav>

      {/* 🆕 BOTÓN SCROLL TO TOP */}
      {showScrollTop && (
        <button
          className="scroll-to-top-btn"
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "100px", // Arriba de la barra de navegación
            right: "20px",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #b150a8 0%, #8e3d85 100%)",
            border: "none",
            boxShadow: "0 4px 12px rgba(177, 80, 168, 0.4)",
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
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(177, 80, 168, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1) translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(177, 80, 168, 0.4)";
          }}
        >
          <i className="bx bx-up-arrow-alt"></i>
        </button>
      )}

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

export default BottomNav;