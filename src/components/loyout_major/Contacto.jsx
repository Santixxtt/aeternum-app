import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../assets/css/Contacto.css";
import Footer from "../loyout_reusable/footer";

function Contacto() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: false,
    message: ""
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: false, message: "" });

    // Validación básica
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus({
        loading: false,
        error: true,
        success: false,
        message: "Por favor, completa todos los campos."
      });
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus({
        loading: false,
        error: true,
        success: false,
        message: "Por favor, ingresa un correo electrónico válido."
      });
      return;
    }

    try {

      const serviceID = "service_3zkhwza"; 
      const templateID = "template_2tyzpue"; 
      const publicKey = "OiRGjG1wXMOal_r3P"; 

      // Cargar el script de EmailJS si no está cargado
      if (!window.emailjs) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = () => {
          window.emailjs.init(publicKey);
          sendEmail();
        };
        document.head.appendChild(script);
      } else {
        sendEmail();
      }

      function sendEmail() {
        window.emailjs.send(serviceID, templateID, {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: "aeternum538@gmail.com"
        })
        .then(() => {
          setStatus({
            loading: false,
            success: true,
            error: false,
            message: "¡Mensaje enviado exitosamente! Te responderemos pronto."
          });
          // Limpiar formulario
          setFormData({
            name: "",
            email: "",
            subject: "",
            message: ""
          });
        })
        .catch((error) => {
          console.error("Error al enviar:", error);
          setStatus({
            loading: false,
            error: true,
            success: false,
            message: "Error al enviar el mensaje. Por favor, intenta de nuevo o escríbenos directamente a aeternum538@gmail.com"
          });
        });
      }

    } catch (error) {
      setStatus({
        loading: false,
        error: true,
        success: false,
        message: "Error al enviar el mensaje. Por favor, intenta de nuevo."
      });
    }
  };

  return (
    <div className="contact-page">
      <main className="contact-container">
        <nav className="back-nav">
          <button onClick={() => navigate(-1)} className="back-link">
            <i className='bx bx-chevron-left'></i>
            Volver
          </button>
        </nav>
        
        <div className="contact-header">
          <h1>📬 Contáctanos</h1>
          <p>¿Tienes alguna pregunta, sugerencia o necesitas ayuda? Estamos aquí para ayudarte.</p>
        </div>

        <div className="contact-content">
          {/* Información de Contacto */}
          <div className="contact-info">
            <div className="info-card">
              <i className='bx bx-envelope'></i>
              <h3>Correo Electrónico</h3>
              <a href="mailto:aeternum538@gmail.com">aeternum538@gmail.com</a>
            </div>

            <div className="info-card">
              <i className='bx bx-help-circle'></i>
              <h3>Documentación</h3>
              <a href="https://santixxtt.github.io/Documentacion-Aeternum/" target="_blank" rel="noopener noreferrer">
                Ver Guía de Usuario
              </a>
            </div>

            <div className="info-card">
              <i className='bx bx-time-five'></i>
              <h3>Tiempo de Respuesta</h3>
              <p>Máximo 5 días hábiles</p>
            </div>

            {/* 🔧 SECCIÓN PARA REDES SOCIALES - Agrega tus links */}
            <div className="info-card social-card">
              <i className='bx bx-share-alt'></i>
              <h3>Síguenos</h3>
              <div className="social-links">
                <a href="#" target="_blank" rel="noopener noreferrer" title="Facebook">
                  <i className='bx bxl-facebook-circle'></i>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" title="Twitter">
                  <i className='bx bxl-twitter'></i>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" title="Instagram">
                  <i className='bx bxl-instagram'></i>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                  <i className='bx bxl-linkedin-square'></i>
                </a>
              </div>
            </div>
          </div>

          {/* Formulario de Contacto */}
          <div className="contact-form-wrapper">
            <h2>Envíanos un mensaje</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Nombre completo *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo electrónico *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Asunto *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="¿En qué podemos ayudarte?"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Mensaje *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Escribe tu mensaje aquí..."
                  rows="6"
                  required
                ></textarea>
              </div>

              {/* Mensajes de estado */}
              {status.success && (
                <div className="alert alert-success">
                  <i className='bx bx-check-circle'></i>
                  {status.message}
                </div>
              )}

              {status.error && (
                <div className="alert alert-error">
                  <i className='bx bx-error-circle'></i>
                  {status.message}
                </div>
              )}

              <button 
                type="submit" 
                className="submit-button"
                disabled={status.loading}
              >
                {status.loading ? (
                  <>
                    <i className='bx bx-loader-alt bx-spin'></i>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className='bx bx-send'></i>
                    Enviar Mensaje
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Rápido */}
        <div className="faq-section">
          <h2>Preguntas Frecuentes</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>¿Cómo puedo registrarme?</h4>
              <p>Haz clic en el botón "Login" en la parte superior y selecciona "Registrarse".</p>
            </div>
            <div className="faq-item">
              <h4>¿Los libros son gratuitos?</h4>
              <p>Sí, Aeternum es completamente gratuito. Accedemos a libros de dominio público a través de OpenLibrary.</p>
            </div>
            <div className="faq-item">
              <h4>¿Puedo descargar libros?</h4>
              <p>Puedes descargar libros que estén disponibles en dominio público o con licencia abierta.</p>
            </div>
            <div className="faq-item">
              <h4>¿Cómo funciona el préstamo?</h4>
              <p>Algunos libros permiten préstamo temporal. Te redirigiremos a OpenLibrary para completar el proceso.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Contacto;