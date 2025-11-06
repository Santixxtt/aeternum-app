import React, { useState } from "react";
// Importar useLocation para obtener la URL actual
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import logo from "../../assets/img/aeternum_logo.png";

const HeaderMovil = ({ onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // 1. Obtener la ubicación actual (location object)
  const location = useLocation(); 

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/");
  };
  
  // 2. Función para chequear si la ruta actual incluye la ruta del enlace
  const isActive = (path) => {
    // Usamos .includes() para capturar rutas base como /loyout_librarian/Usuarios
    return location.pathname.includes(path);
  };
  
  // 3. Lógica para el Home (coincidencia exacta) para que no se active en subpáginas
  const isHomeActive = location.pathname === "/loyout_librarian/dashboard_librarian";


  return (
    <>
      {/* 🔹 Header superior (logo + hamburguesa) */}
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
          {/* Logo */}
          <img
            src={logo}
            alt="Aeternum Logo"
            className="logo"
            style={{ height: "40px", cursor: "pointer", objectFit: "contain", }}
            onClick={() => navigate("/loyout_librarian/dashboard_librarian")}
          />

          {/* Icono hamburguesa */}
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
            <i className={`bx ${menuOpen ? "bx-x" : "bx-menu"} text-3xl`}></i>
          </button>
        </div>

        {/* 🔹 Menú desplegable */}
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
              width: "150px",
              zIndex: 999,
            }}
          >
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
                navigate("/loyout_librarian/perfil");
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

      {/* 🔹 Barra inferior de navegación (Lógica Corregida) */}
      <nav className="bottom-nav dashboard-nav">
        
        {/* INICIO */}
        <Link
          to="/loyout_librarian/dashboard_librarian"
          className={`nav-item ${isHomeActive ? "active" : ""}`}
        >
          <i className="bx bx-home"></i>
          <span>Inicio</span>
        </Link>

        {/* USUARIOS */}
        <Link 
          to="/loyout_librarian/Usuarios" 
          className={`nav-item ${isActive("/Usuarios") ? "active" : ""}`}
        >
          <i className="bx bx-user"></i>
          <span>Usuarios</span>
        </Link>

        {/* LIBROS */}
        <Link 
          to="/loyout_librarian/libros" 
          className={`nav-item ${isActive("/libros") ? "active" : ""}`}
        >
          <i className="bx bx-book"></i>
          <span>Libros</span>
        </Link>

        {/* PRÉSTAMOS */}
        <Link 
          to="/loyout_librarian/prestamos" 
          className={`nav-item ${isActive("/prestamos") ? "active" : ""}`} 
        >
          <i className="bx bx-book-bookmark"></i>
          <span>Préstamos</span>
        </Link>
      </nav>
    </>
  );
};

export default HeaderMovil;