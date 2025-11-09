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
            <Link to="/contacto" className="nav-item">
                <i className="bx bx-phone"></i>
                <span>Contacto</span>
            </Link>
            <Link to="/login" className="nav-item">
                <i className="bx bx-user"></i>
                <span>Ingreso</span>
            </Link>
        </nav>
    );
};

export default BottomNav;