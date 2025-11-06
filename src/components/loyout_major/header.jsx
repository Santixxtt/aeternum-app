// Header.jsx (Invitado)
import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/img/aeternum_logo.png";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation(); 

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        const navbar = document.getElementById("navbar");

        const handleScroll = () => {
            if (window.innerWidth > 768) {
                if (window.scrollY > 50) {
                    if (navbar) { 
                        navbar.classList.add("sticky");
                    }
                } else {
                    if (navbar) {
                        navbar.classList.remove("sticky");
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleNavigate = (path) => {
        navigate(path);
    };

    return (
        <header className="header" id="navbar">
            <div className="header-content">
                {/* LOGO */}
                <div className="logo" onClick={() => handleNavigate("/")} style={{ cursor: "pointer" }}>
                    <img src={logo} alt="Logo Aeternum" />
                </div>

                {/* NAVEGACIÓN (Centrada) */}
                <nav className="nav">
                    <ul>
                        <li onClick={() => handleNavigate("/")} className={isActive("/") ? 'active' : ''}>
                            <i className="bx bx-home"></i> Inicio
                        </li>
                        <li onClick={() => handleNavigate("/catalogo")} className={isActive("/catalogo") ? 'active' : ''}>
                            <i className="bx bx-book"></i> Catálogo
                        </li>
                        <li onClick={() => handleNavigate("/contacto")} className={isActive("/contacto") ? 'active' : ''}>
                            <i className="bx bx-phone"></i> Contacto
                        </li>
                    </ul>
                </nav>

                {/* BOTÓN INICIAR SESIÓN (A la derecha) */}
                <div className="login-wrapper"> {/* ✅ Nuevo contenedor */}
                    <Link to="/login" className="login-button">
                        <i className="bx bx-user-circle"></i> Iniciar sesión
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;