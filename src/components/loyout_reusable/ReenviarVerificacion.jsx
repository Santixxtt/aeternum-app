import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../assets/css/verify-email.css";

export default function ReenviarVerificacion() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setStatus("error");
      setMessage("Por favor ingresa tu correo electrónico.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await axios.post(
        `https://backend-production-9f93.up.railway.app/auth/reenviar-verificacion`,
        { correo: email }
      );

      setStatus("success");
      setMessage(response.data.message || "Correo de verificación enviado exitosamente.");
    } catch (err) {
      setStatus("error");
      const errorMsg =
        err.response?.data?.detail ||
        "No se pudo enviar el correo. Intenta nuevamente.";
      setMessage(errorMsg);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "Arial, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "40px",
        maxWidth: "450px",
        width: "100%",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{
            width: "70px",
            height: "70px",
            background: "#B6407D",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "35px",
            color: "white"
          }}>
            ✉️
          </div>
          <h2 style={{ margin: "0 0 10px", color: "#333", fontSize: "24px" }}>
            Reenviar Verificación
          </h2>
          <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>
            Ingresa tu correo y te enviaremos un nuevo enlace de verificación
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#333",
              fontWeight: "500",
              fontSize: "14px"
            }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                transition: "border-color 0.3s",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#B6407D"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          {/* Message */}
          {message && (
            <div style={{
              padding: "12px 15px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              background: status === "success" ? "#d4edda" : "#f8d7da",
              color: status === "success" ? "#155724" : "#721c24",
              border: `1px solid ${status === "success" ? "#c3e6cb" : "#f5c6cb"}`
            }}>
              {status === "success" && <span style={{ marginRight: "8px" }}>✅</span>}
              {status === "error" && <span style={{ marginRight: "8px" }}>❌</span>}
              {message}
            </div>
          )}

          {/* Buttons */}
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              width: "100%",
              padding: "14px",
              background: status === "loading" ? "#ccc" : "#B6407D",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: status === "loading" ? "not-allowed" : "pointer",
              transition: "background 0.3s",
              marginBottom: "15px"
            }}
            onMouseEnter={(e) => {
              if (status !== "loading") e.target.style.background = "#9a3568";
            }}
            onMouseLeave={(e) => {
              if (status !== "loading") e.target.style.background = "#B6407D";
            }}
          >
            {status === "loading" ? "Enviando..." : "Reenviar Correo"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            disabled={status === "loading"}
            style={{
              width: "100%",
              padding: "14px",
              background: "transparent",
              color: "#B6407D",
              border: "2px solid #B6407D",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: status === "loading" ? "not-allowed" : "pointer",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              if (status !== "loading") {
                e.target.style.background = "#B6407D";
                e.target.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (status !== "loading") {
                e.target.style.background = "transparent";
                e.target.style.color = "#B6407D";
              }
            }}
          >
            Volver al Inicio de Sesión
          </button>
        </form>

        {/* Help Text */}
        {status === "success" && (
          <div style={{
            marginTop: "25px",
            padding: "15px",
            background: "#e7f3ff",
            borderRadius: "8px",
            borderLeft: "4px solid #0066cc"
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#004085" }}>
              💡 <strong>Revisa tu bandeja de entrada</strong> y también la carpeta de spam. 
              El enlace expirará en 24 horas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}