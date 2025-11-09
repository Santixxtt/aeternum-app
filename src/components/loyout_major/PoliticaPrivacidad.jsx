import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../../assets/css/PoliticaPrivacidad.css"
import Footer from "../loyout_reusable/footer";

function PoliticaPrivacidad() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="privacy-page">
      <main className="privacy-container">
        <nav className="back-nav">
          <button onClick={() => navigate(-1)} className="back-link">
            <i className='bx bx-chevron-left'></i>
            Volver
          </button>
        </nav>
        
        <h1>📜 Política de Privacidad</h1>
        <p className="last-updated">
          <strong>Última actualización:</strong> <time dateTime="2025-08-31">31 de agosto de 2025</time>
        </p>

        <section className="section-intro">
          <p>
            En <strong>Aeternum</strong>, nos comprometemos a proteger la privacidad de nuestros usuarios. 
            Esta política explica cómo recopilamos, usamos y protegemos la información personal que nos 
            proporcionas al utilizar nuestra plataforma.
          </p>
        </section>

        <section>
          <h2>1. Información que recopilamos</h2>
          <ul>
            <li>Nombre y apellido</li>
            <li>Tipo de documento</li>
            <li>Número de documento</li>
            <li>Correo electrónico</li>
            <li>Contraseña (almacenada de forma cifrada)</li>
          </ul>
        </section>

        <section>
          <h2>2. Uso de la API de OpenLibrary</h2>
          <p>
            Nuestra plataforma funciona como un puente hacia la API pública de{" "}
            <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">
              OpenLibrary
            </a>
            . A través de esta integración:
          </p>
          <ul>
            <li>Exploras libros disponibles en OpenLibrary.</li>
            <li>Algunos títulos permiten descarga directa desde la API.</li>
            <li>
              Otros ofrecen la opción de préstamo, redirigiéndote a la página oficial de OpenLibrary.
            </li>
          </ul>
          <p>
            <strong>Nota:</strong> No almacenamos ni gestionamos directamente los contenidos ni las 
            funcionalidades de OpenLibrary. Cualquier interacción con su plataforma se rige por sus 
            propios términos y políticas.
          </p>
        </section>
        
        <section>
          <h2>3. Funcionalidades personalizadas</h2>
          <ul>
            <li>Crear una lista de deseos.</li>
            <li>Guardar libros que te interesan para futuras consultas.</li>
          </ul>
        </section>

        <section>
          <h2>4. Protección de tus datos</h2>
          <p><strong>Medidas de seguridad implementadas:</strong></p>
          <ul>
            <li>
              <strong>Cifrado de contraseñas:</strong> Tu contraseña se almacena de forma segura utilizando 
              algoritmos de hash (bcrypt), lo que significa que ni siquiera nosotros podemos ver tu contraseña.
            </li>
            <li>
              <strong>Cifrado SSL/TLS:</strong> Todas las comunicaciones entre tu navegador y nuestros 
              servidores están cifradas.
            </li>
            <li>
              <strong>Autenticación segura:</strong> Utilizamos tokens JWT para mantener tu sesión activa 
              de forma segura.
            </li>
            <li>
              <strong>Acceso restringido:</strong> Solo personal autorizado tiene acceso a la base de datos.
            </li>
            <li>
              <strong>Copias de seguridad:</strong> Realizamos respaldos periódicos de la información para 
              prevenir pérdida de datos.
            </li>
            <li>
              No compartimos tus datos personales con terceros, salvo obligación legal.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Tratamiento de datos</h2>
          <p>
            El tratamiento de tus datos personales se realiza con base en tu consentimiento, el 
            cumplimiento de obligaciones legales y nuestro interés legítimo en mejorar la experiencia 
            del usuario. Solo utilizamos tus datos para los fines descritos en esta política.
          </p>
          <p><strong>Bases legales para el tratamiento:</strong></p>
          <ul>
            <li><strong>Consentimiento:</strong> Al registrarte aceptas nuestros términos y condiciones.</li>
            <li><strong>Ejecución de contrato:</strong> Para prestarte el servicio de biblioteca digital y gestionar tus préstamos.</li>
            <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios, prevenir fraudes y garantizar la seguridad de la plataforma.</li>
          </ul>
        </section>

        <section>
          <h2>6. Conservación de datos</h2>
          <p>
            Conservamos tus datos personales mientras mantengas tu cuenta activa o durante el tiempo 
            necesario para cumplir con obligaciones legales. Puedes solicitar la eliminación de tu 
            cuenta y datos en cualquier momento.
          </p>
        </section>

        <section>
          <h2>7. Protección de menores</h2>
          <p>
            Este sitio no está dirigido a menores de 14 años. No recopilamos intencionalmente datos 
            de menores sin el consentimiento de sus padres o tutores. Si descubrimos que hemos 
            recopilado datos de un menor sin autorización, los eliminaremos de forma inmediata.
          </p>
        </section>

        <section>
          <h2>8. Derechos del usuario</h2>
          <p>Como titular de tus datos, tienes derecho a:</p>
          <ul>
            <li>Acceder, rectificar o eliminar tu información personal.</li>
            <li>Solicitar la limitación del tratamiento de tus datos.</li>
            <li>Retirar tu consentimiento en cualquier momento.</li>
            <li>Solicitar la portabilidad de tus datos a otra plataforma.</li>
            <li>Oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
          </ul>
          <p>
            Para ejercer estos derechos, escríbenos a:{" "}
            <strong>
              <a href="mailto:aeternum538@gmail.com">aeternum538@gmail.com</a>
            </strong>
          </p>
          <p>
            <strong>Nos comprometemos a responder tus solicitudes en un plazo máximo de 30 días 
            calendario desde su recepción.</strong>
          </p>
        </section>
        
        <section>
          <h2>9. Cambios en esta política</h2>
          <p>
            Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. 
            Te notificaremos cualquier cambio relevante a través del sitio web o por correo electrónico.
          </p>
        </section>

        <section>
          <h2>10. Transferencias internacionales de datos</h2>
          <p>
            Tus datos se almacenan en servidores ubicados en América (Railway). Estos servicios 
            cumplen con estándares internacionales de protección de datos y garantizan medidas de 
            seguridad adecuadas para proteger tu información personal.
          </p>
        </section>

        <section>
          <h2>11. Autoridad de protección de datos</h2>
          <p>
            Si consideras que tus derechos de protección de datos no han sido respetados, puedes 
            presentar una reclamación ante la{" "}
            <strong>Superintendencia de Industria y Comercio (SIC) de Colombia</strong>, autoridad 
            encargada de la protección de datos personales en el país.
          </p>
          <p>
            Más información en:{" "}
            <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer">
              www.sic.gov.co
            </a>
          </p>
        </section>

        <section>
          <h2>12. Notificación de incidentes de seguridad</h2>
          <p>
            En caso de una brecha de seguridad que pueda afectar tus datos personales, nos 
            comprometemos a notificarte en un plazo máximo de 72 horas desde que tengamos conocimiento 
            del incidente. Tomaremos todas las medidas correctivas necesarias para minimizar cualquier 
            impacto y proteger tu información.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default PoliticaPrivacidad;