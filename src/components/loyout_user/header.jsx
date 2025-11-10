import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/img/aeternum_logo.png";
import "../../assets/css/dashboard_user.css";

// Recibimos la nueva prop onRedirectToLogin
const Header = ({ onSearch, onLogout, usuario, onRedirectToLogin }) => { 
    
    const location = useLocation();
    const [showMenu, setShowMenu] = useState(false);
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    
    // ✅ Ref para el menú de usuario
    const menuRef = useRef(null);

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        const navbar = document.querySelector(".header"); 
        
        const handleScroll = () => {
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add("sticky");
                } else {
                    navbar.classList.remove("sticky");
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Efecto para detectar clics fuera del menú
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Si el menú está abierto y el clic fue fuera del menú
            if (showMenu && menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        // Agregar el listener solo cuando el menú esté abierto
        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        // Limpiar el listener
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMenu]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (onSearch) onSearch(query);
    };

    const handleQueryChange = (e) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        if (newQuery.length === 0 && onSearch) {
            onSearch(newQuery);
        }
    };
    
    //  Lógica de redirección CLAVE: Si no hay usuario, redirige inmediatamente
    const handleUserIconClick = () => {
        if (!usuario && onRedirectToLogin) {
            onRedirectToLogin();
            return; // Detiene la ejecución aquí
        } 
        // Si hay usuario, alterna el menú
        setShowMenu(!showMenu);
    };
    
    const handleLogout = () => {
        if (onLogout) onLogout();
        // Nota: onLogout ya debería limpiar el token y navegar en el componente padre (Catalogo)
        setShowMenu(false);
    };

    const handleNavigate = (path) => {
        navigate(path);
        setShowMenu(false);
    };

    return (
        <header className="header" id="navbar">
            <div className="header-content">
                <div
                    className="logo"
                    onClick={() => handleNavigate("/loyout_user/dashboard_user")}
                    style={{ cursor: "pointer" }}
                >
                    <img src={logo} alt="logo" />
                </div>

                <nav className="nav">
                    <ul>
                        <li 
                            onClick={() => handleNavigate("/loyout_user/dashboard_user")}
                            className={isActive("/loyout_user/dashboard_user") ? 'active' : ''}
                        >
                            <i className="bx bx-home"></i> Inicio
                        </li>
                        <li 
                            onClick={() => handleNavigate("/catalogo")}
                            className={isActive("/catalogo") ? 'active' : ''}
                        >
                            <i className="bx bx-book"></i> Catálogo
                        </li>
                        <li 
                            onClick={() => handleNavigate("/loyout_user/lista_deseos")}
                            className={isActive("/loyout_user/lista_deseos") ? 'active' : ''}
                        >
                            <i className="bx bx-star"></i> Lista de Deseos
                        </li>
                    </ul>
                </nav>

                {/* Barra de búsqueda */}
                <form className="search-bar" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Buscar libros..."
                        value={query}
                        onChange={handleQueryChange}
                    />
                    <button type="submit">
                        <i className="bx bx-search"></i>
                    </button>
                </form>

                {/* ✅ Agregamos ref al contenedor del menú */}
                <div className="user-menu" ref={menuRef}>
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
                            
                            <li onClick={() => handleNavigate("/loyout_user/perfil")}>
                                <i className='bxr bx-face'></i> Perfil
                            </li>

                            <li onClick={() => handleNavigate("/loyout_user/mis_prestamos")}>
                                <i className='bxr bx-book-library'></i> Mis Prestamos
                            </li>
                            
                            <li onClick={handleLogout}>
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