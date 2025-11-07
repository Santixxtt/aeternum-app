import { useState } from "react";
import axios from "axios";
import "../../src/assets/css/registro.css";
import Registerimg from "../../src/assets/img/registro.jpg";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    tipo_identificacion: "",
    num_identificacion: "",
    correo: "",
    clave: "",
    consent: false,
    rol: "usuario",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ nivel: 0, texto: "" });
  const [loading, setLoading] = useState(false);

  // --- Calcula la fortaleza de la contraseña ---
  const calcularFortaleza = (pass) => {
    let puntos = 0;
    if (pass.length >= 8) puntos++;
    if (pass.length >= 12) puntos++;
    if (/[a-z]/.test(pass)) puntos++;
    if (/[A-Z]/.test(pass)) puntos++;
    if (/[0-9]/.test(pass)) puntos++;
    if (/[^A-Za-z0-9]/.test(pass)) puntos++;

    let nivel = 0;
    if (puntos <= 1) nivel = 0;
    else if (puntos <= 3) nivel = 1;
    else if (puntos === 4) nivel = 2;
    else if (puntos === 5) nivel = 3;
    else nivel = 4;

    const textos = ["muy débil", "débil", "media", "fuerte", "muy fuerte"];
    return { nivel, texto: textos[nivel] };
  };

  // --- Maneja los cambios en los campos ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (name === "clave") {
      const f = calcularFortaleza(value);
      setStrength(f);
    }
  };

  // --- Validaciones del formulario ---
  const validate = () => {
    const newErrors = {};
    if (form.nombre.trim().length < 3)
      newErrors.nombre = "Debe tener al menos 3 caracteres";
    if (form.apellido.trim().length < 3)
      newErrors.apellido = "Debe tener al menos 3 caracteres";
    if (!form.tipo_identificacion)
      newErrors.tipo_identificacion = "Seleccione un tipo de identificación";
    if (!/^[0-9]{8,10}$/.test(form.num_identificacion.trim()))
      newErrors.num_identificacion =
        "El número debe tener entre 8 y 10 dígitos.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      newErrors.correo = "Formato de correo inválido";
    if (form.clave.length < 8)
      newErrors.clave = "Debe tener al menos 8 caracteres";
    if (!form.consent)
      newErrors.consent = "Debes aceptar la Política de Privacidad.";
    return newErrors;
  };

  // --- Envío del formulario ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/auth/register`,
        form
      );
      alert(response.data.message || "¡Cuenta creada con éxito!");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.detail || "Error al registrar usuario.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-body">
      <div className="register-container">
      <div className="register-login-section">
        <a href="/login" className="register-back-button">
          <i className="bx bx-chevron-left"></i>
        </a>
        <h1>Registro</h1>
        <p>
          Ingrese sus datos para registrarse a <strong>Aeternum</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="register-form-group">
            <label htmlFor="nombre">Nombres</label>
            <input
              type="text"
              name="nombre"
              placeholder="Ingresa tus nombres"
              value={form.nombre}
              onChange={handleChange}
            />
            {errors.nombre && (
              <p className="register-error-message">{errors.nombre}</p>
            )}
          </div>

          <div className="register-form-group">
            <label htmlFor="apellido">Apellidos</label>
            <input
              type="text"
              name="apellido"
              placeholder="Ingresa tus apellidos"
              value={form.apellido}
              onChange={handleChange}
            />
            {errors.apellido && (
              <p className="register-error-message">{errors.apellido}</p>
            )}
          </div>

          <div className="register-form-group">
            <label htmlFor="tipo_identificacion">Tipo de Identificación</label>
            <select
              name="tipo_identificacion"
              value={form.tipo_identificacion}
              onChange={handleChange}
            >
              <option value="">Seleccione un tipo</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula Extranjera</option>
              <option value="TI">Tarjeta de Identidad</option>
            </select>
            {errors.tipo_identificacion && (
              <p className="register-error-message">
                {errors.tipo_identificacion}
              </p>
            )}
          </div>

          <div className="register-form-group">
            <label htmlFor="num_identificacion">
              Número de Identificación
            </label>
            <input
              type="number"
              name="num_identificacion"
              placeholder="Ej. 1234567890"
              value={form.num_identificacion}
              onChange={handleChange}
            />
            {errors.num_identificacion && (
              <p className="register-error-message">
                {errors.num_identificacion}
              </p>
            )}
          </div>

          <div className="register-form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              type="email"
              name="correo"
              placeholder="hey@tuemail.com"
              value={form.correo}
              onChange={handleChange}
            />
            {errors.correo && (
              <p className="register-error-message">{errors.correo}</p>
            )}
          </div>

          <div className="register-form-group password-wrapper">
            <label htmlFor="clave">Contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              name="clave"
              placeholder="Crea una contraseña"
              value={form.clave}
              onChange={handleChange}
            />
            <span
              className="register-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={showPassword ? "bx bx-hide" : "bx bx-show"}></i>
            </span>

            {/* CÓDIGO DE BARRA DE FORTALEZA CORREGIDO */}
            <div className="register-password-strength-container">
              <div
                className={`register-password-strength 
                    ${
                        strength.nivel > 0
                            ? ["weak", "medium", "strong", "very-strong"][strength.nivel - 1]
                            : '' 
                    }`}
                style={{
                    width: `${(strength.nivel / 4) * 100}%` 
                }}
              ></div>
              <small className={`register-strength-text strength-${strength.nivel}`}>
                  {strength.texto && `Fortaleza: ${strength.texto}`}
              </small>
            </div>
            {errors.clave && (
              <p className="register-error-message">{errors.clave}</p>
            )}
          </div>
          {/* FIN CÓDIGO DE BARRA DE FORTALEZA CORREGIDO */}

          <div className="register-consent">
            <input
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={handleChange}
            />
            <label htmlFor="consent">
              He leído y acepto la{" "}
              <a
                href="politica_privacidad.html"
                target="_blank"
                rel="noreferrer"
              >
                Política de Privacidad
              </a>
              .
            </label>
          </div>
          {errors.consent && (
            <p className="register-error-message">{errors.consent}</p>
          )}

          <button
            type="submit"
            className="register-login-button"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="register-register-link">
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
        </p>
      </div>

      <div className="register-image-section">
        <img src={Registerimg} alt="Registro Aeternum" />
      </div>
    </div>
    </div>
  );
}