// src/context/AuthProvider.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function AuthProvider({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/"); 
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; 

        if (decoded.exp < currentTime) {
          // Token expirado
          localStorage.removeItem("token");
          navigate("/"); // Redirige al home/login
        }
      } catch (error) {
        console.error("Token inválido:", error);
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    // Chequeo inicial
    checkToken();

    // Chequeo periódico cada 30 segundos
    const interval = setInterval(checkToken, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  return children;
}
