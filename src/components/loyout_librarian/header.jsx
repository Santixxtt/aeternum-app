import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/img/aeternum_logo.png";
import "../../assets/css/dashboard_user.css";

const Header = ({ onSearch, onLogout, usuario, onRedirectToLogin}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [query] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const navbar = document.getElementById("navbar");

    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add("sticky");
      } else {
        navbar.classList.remove("sticky");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    setShowMenu(false);
  };

      const handleUserIconClick = () => {
        if (!usuario && onRedirectToLogin) {
            onRedirectToLogin();
            return; // Detiene la ejecución aquí
        } 
        // Si hay usuario, alterna el menú
        setShowMenu(!showMenu);
    };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate("/");
  };

  return (
    <header className="header" id="navbar">
      <div className="header-content">

        {/* Logo */}
        <div className="logo" onClick={() => handleNavigate("/loyout_librarian/dashboard_librarian")} style={{ cursor: "pointer" }}>
          <img src={logo} alt="Aeternum Logo" />
        </div>

        {/* Navegación */}
        <nav className="nav">
          <ul>
            <li
              onClick={() => handleNavigate("/loyout_librarian/dashboard_librarian")}
              className={isActive("/loyout_librarian/dashboard_librarian") ? "active" : ""}
            >
              <i className="bx bx-home"></i> Inicio
            </li>

            <li
              onClick={() => handleNavigate("/loyout_librarian/Usuarios")}
              className={isActive("/loyout_librarian/Usuarios") ? "active" : ""}
            >
              <i class='bxr  bx-user'></i>  Usuarios
            </li>

            <li
              onClick={() => handleNavigate("/loyout_librarian/libros")}
              className={isActive("/loyout_librarian/libros") ? "active" : ""}
            >
              <i className="bx bx-book"></i> Libros
            </li>

            <li
              onClick={() => handleNavigate("/loyout_librarian/prestamos")}
              className={isActive("/loyout_librarian/prestamos") ? "active" : ""}
            >
              <i className="bx bx-book-bookmark"></i> Préstamos
            </li>
          </ul>
        </nav>

        {/* Search bar */}
        <form className="search-bar" onSubmit={handleSearch}></form>

        {/* Menú usuario */}
        <div className="user-menu">

          <i
            className="bx bx-user-circle user-icon"
            onClick={handleUserIconClick}
            style={{ cursor: "pointer" }}
          ></i>

          {usuario && showMenu && (
              <ul className="dropdown">
                  <li className="user-info"> 
                      <i className='bx bx-user'></i> {usuario.nombre} {usuario.apellido}
                  </li>
                  <li onClick={() => handleNavigate("/loyout_librarian/perfil")}>
                      <i className="bx bx-user"></i> Perfil
                  </li>
                  <li onClick={handleLogoutClick}>
                      <i className="bx bx-log-out"></i> Cerrar sesión
                  </li>
              </ul>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
