import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./assets/css/dashboard_user.css";
import "bootstrap/dist/css/bootstrap.min.css";

// Componentes principales
import Home from "./components/home"; 
import Login from "./components/login";
import Register from "./components/register";
import ResetPassword from "./components/ResetPassword";
import PoliticaPrivacidad from "./components/loyout_major/PoliticaPrivacidad";
import TerminosServicio from "./components/loyout_major/TerminosServicio";
import Contacto from "./components/loyout_major/Contacto";


// Dashboard (usuario)
import DashboardUser from "./components/loyout_user/dashboard_user";
import Catalogo from "./components/loyout_major/catalogo";
import Listadeseos from "./components/loyout_user/listadeseos";
import MisPrestamos from "./components/loyout_user/MisPrestamos";
import Perfil from "./components/loyout_user/perfil";

// Dashboard (Bibliotecario)
import DashboardLibrarian from "./components/loyout_librarian/dashboard_librarian";
import Usuarios from "./components/loyout_librarian/Usuarios";
import Libros from "./components/loyout_librarian/Libros";
import Prestamos from "./components/loyout_librarian/Prestamos";

// Contexto de autenticación
import AuthProvider from "./auth/AuthProvider";

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    AOS.init({ duration: 800 });

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Router>
      <Routes>
        {/* 🔹 Rutas públicas */}
        <Route path="/" element={<Home isMobile={isMobile} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />
        <Route path="/catalogo" element={<Catalogo isMobile={isMobile} />} />
        <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/terminos-servicio" element={<TerminosServicio />} />
        <Route path="/contacto" element={<Contacto />} />



        {/* 🔒 Rutas protegidas dentro del AuthProvider */}
        <Route
          path="/loyout_user/*"
          element={
            <AuthProvider>
              <Routes>
                <Route path="dashboard_user" element={<DashboardUser isMobile={isMobile} />} />
                <Route path="lista_deseos" element={<Listadeseos isMobile={isMobile} />} />
                <Route path="mis_prestamos" element={<MisPrestamos isMobile={isMobile} />} />
                <Route path="perfil" element={<Perfil isMobile={isMobile} />} />
              </Routes>
            </AuthProvider>
          }
        />

        {/* 🔒 Rutas protegidas - Bibliotecario */}
        <Route
          path="/loyout_librarian/*"
          element={
            <AuthProvider>
              <Routes>
                <Route path="dashboard_librarian" element={<DashboardLibrarian />} />
                <Route path="usuarios" element={<Usuarios />} />
                <Route path="libros" element={<Libros />} />
                <Route path="prestamos" element={<Prestamos />} />
              </Routes>
            </AuthProvider>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;