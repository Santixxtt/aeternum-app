import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import HeaderMovil from "./HeaderMovil"; 
import EstadisticasGenerales from "./EstadisticasGenerales";
import Alertas from "./Alertas";
import GraficaPrestamos from "./GraficaPrestamos";
import Footer from "../loyout_reusable/footer";
import AeternumBienvenida from "../loyout_reusable/AeternumBienvenida";
import LibrosPopulares from "./LibrosPopulares";

const DashboardLibrarian = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // 🔹 Detectar móvil por ancho de pantalla y userAgent
  useEffect(() => {
    const checkDevice = () => {
      const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch("https://backend-production-9f93.up.railway.app/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Error obteniendo usuario");

        const data = await response.json();
        setUsuario(data);
      } catch (error) {
        console.error(error);
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  return (
    <AeternumBienvenida>
      <div className="dashboard-user">
        {/* 🔹 Header cambia automáticamente según el dispositivo */}
        {isMobile ? (
          <HeaderMovil onLogout={handleLogout} usuario={usuario}/>
        ) : (
          <Header onLogout={handleLogout} usuario={usuario} />
        )}

        <main>
          <div className="text-center p-5">
            <h1>Hola, {usuario?.nombre} {usuario?.apellido}</h1>
            <p>Aquí puedes ver, editar y eliminar todo lo de la página 😁.</p>
          </div>

          <div className="dashboard-row">
            <div className="dashboard-left">
              <EstadisticasGenerales />
            </div>
            <div className="dashboard-right">
              <GraficaPrestamos />
            </div>
          </div>

          {/* FILA 2 */}
          <div className="dashboard-row">
            <div className="dashboard-left">
              <Alertas />
            </div>
            <div className="dashboard-right">
              <LibrosPopulares />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </AeternumBienvenida>
  );
};

export default DashboardLibrarian;