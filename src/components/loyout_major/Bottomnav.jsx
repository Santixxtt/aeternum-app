import React from "react";
import { Link } from "react-router-dom";
const BottomNav = () => { 
    
    return (
        <nav className="bottom-nav">
            <Link to="/" className="nav-item active">
                <i className="bx bx-home"></i>
                <span>Inicio</span>
            </Link>
            <Link to="/catalogo" className="nav-item">
                <i className="bx bx-book"></i>
                <span>Catálogo</span>
            </Link>
            {/* Estos enlaces deberían ser ajustados a tus rutas públicas */}
            <a href="#" className="nav-item">
                <i className="bx bx-phone"></i>
                <span>Contacto</span>
            </a>
            <Link to="/login" className="nav-item">
                <i className="bx bx-user"></i>
                <span>Ingreso</span>
            </Link>
        </nav>
    );
};

export default BottomNav;