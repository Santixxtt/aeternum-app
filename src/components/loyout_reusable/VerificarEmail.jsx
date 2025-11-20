import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../assets/css/verificar-email.css";

export default function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("user_id");

    console.log("TOKEN OBTENIDO:", token);
    console.log("USER ID OBTENIDO:", userId);

    if (!token || !userId) {
      setStatus("error");
      setMessage("Enlace de verificación inválido.");
      return;
    }

    verifyEmail(token, userId);
  }, [searchParams]);


  // Redirigir automáticamente después de verificación exitosa
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      navigate("/login");
    }
  }, [status, countdown, navigate]);

  const verifyEmail = async (token, userId) => {
    try {
      const response = await axios.get(
        `https://backend-production-9f93.up.railway.app/auth/verificar-email`,
        {
          params: { token, user_id: userId },
        }
      );

      setStatus("success");
      setMessage(response.data.message || "¡Email verificado con éxito!");
    } catch (err) {
      setStatus("error");
      const errorMsg =
        err.response?.data?.detail ||
        "No se pudo verificar tu correo. El enlace puede haber expirado.";
      setMessage(errorMsg);
    }
  };

  return (
    <div className="verificar-email-container">
      <div className="verificar-email-card">
        {status === "loading" && (
          <>
            <div className="spinner"></div>
            <h2>Verificando tu correo...</h2>
            <p>Por favor espera un momento.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="success-icon">
              <i className="bx bx-check-circle"></i>
            </div>
            <h2>¡Correo verificado!</h2>
            <p>{message}</p>
            <p className="countdown-text">
              Redirigiendo al inicio de sesión en <strong>{countdown}</strong>{" "}
              segundos...
            </p>
            <button
              onClick={() => navigate("/login")}
              className="verify-btn"
            >
              Ir al inicio de sesión ahora
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="error-icon">
              <i className="bx bx-error-circle"></i>
            </div>
            <h2>Error de verificación</h2>
            <p>{message}</p>
            <div className="error-actions">
              <button
                onClick={() => navigate("/login")}
                className="verify-btn secondary"
              >
                Volver al inicio
              </button>
              <button
                onClick={() => navigate("/reenviar-verificacion")}
                className="verify-btn"
              >
                Reenviar correo de verificación
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}