import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../../assets/css/TerminosServicio.css"
import Footer from "../loyout_reusable/footer";

function TerminosServicio() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="terms-page">
      <main className="terms-container">
        <nav className="back-nav">
          <button onClick={() => navigate(-1)} className="back-link">
            <i className='bx bx-chevron-left'></i>
            Volver
          </button>
        </nav>
        
        <h1>📄 Términos de Servicio</h1>
        <p className="last-updated">
          <strong>Última actualización:</strong> <time dateTime="2025-11-08">08 de noviembre de 2025</time>
        </p>

        <section className="section-intro">
          <p>
            Bienvenido a <strong>Aeternum</strong>. Estos Términos de Servicio regulan el acceso y uso 
            de nuestra plataforma de biblioteca digital. Al registrarte y utilizar nuestros servicios, 
            aceptas estar sujeto a estos términos. Por favor, léelos cuidadosamente.
          </p>
        </section>

        <section>
          <h2>1. Aceptación de los términos</h2>
          <p>
            Al acceder y utilizar Aeternum, declaras que:
          </p>
          <ul>
            <li>Has leído, comprendido y aceptado estos Términos de Servicio.</li>
            <li>Tienes al menos 14 años de edad o cuentas con el consentimiento de tus padres o tutores legales.</li>
            <li>Tienes la capacidad legal para aceptar estos términos en tu jurisdicción.</li>
            <li>Te comprometes a cumplir con todas las leyes aplicables al usar nuestro servicio.</li>
          </ul>
          <p>
            Si no estás de acuerdo con estos términos, por favor abstente de usar la plataforma.
          </p>
        </section>

        <section>
          <h2>2. Descripción del servicio</h2>
          <p>
            <strong>Aeternum</strong> es una plataforma digital que te permite:
          </p>
          <ul>
            <li>Buscar y explorar libros disponibles a través de la API pública de OpenLibrary.</li>
            <li>Crear y gestionar una lista de deseos personalizada con tus libros favoritos.</li>
            <li>Acceder a préstamos virtuales de libros cuando estén disponibles.</li>
            <li>Descargar libros que se encuentren en dominio público o con licencia abierta.</li>
          </ul>
          <p>
            <strong>Importante:</strong> Aeternum funciona como intermediario hacia OpenLibrary. No alojamos 
            ni distribuimos directamente el contenido de los libros. La disponibilidad de títulos, préstamos 
            y descargas depende de OpenLibrary y sus políticas.
          </p>
        </section>

        <section>
          <h2>3. Registro y cuenta de usuario</h2>
          <p>Para utilizar Aeternum, debes crear una cuenta proporcionando:</p>
          <ul>
            <li>Nombre y apellido</li>
            <li>Tipo y número de documento de identidad</li>
            <li>Correo electrónico válido</li>
            <li>Contraseña segura</li>
          </ul>
          <p><strong>Te comprometes a:</strong></p>
          <ul>
            <li>Proporcionar información veraz, actualizada y completa.</li>
            <li>Mantener la confidencialidad de tu contraseña.</li>
            <li>Notificarnos inmediatamente si sospechas de acceso no autorizado a tu cuenta.</li>
            <li>No compartir tu cuenta con terceros.</li>
            <li>No crear múltiples cuentas sin autorización.</li>
          </ul>
          <p>
            Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos o 
            proporcionen información falsa.
          </p>
        </section>

        <section>
          <h2>4. Uso aceptable de la plataforma</h2>
          <p>Al usar Aeternum, te comprometes a NO:</p>
          <ul>
            <li>Utilizar el servicio para fines ilegales o no autorizados.</li>
            <li>Distribuir, vender o comercializar contenido protegido por derechos de autor sin autorización.</li>
            <li>Intentar acceder de forma no autorizada a nuestros sistemas, servidores o bases de datos.</li>
            <li>Utilizar bots, scrapers o cualquier herramienta automatizada sin permiso expreso.</li>
            <li>Publicar contenido ofensivo, difamatorio, malicioso o que viole derechos de terceros.</li>
            <li>Interferir con el funcionamiento normal de la plataforma.</li>
            <li>Crear múltiples cuentas falsas o usar identidades fraudulentas.</li>
            <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la plataforma.</li>
          </ul>
          <p>
            El incumplimiento de estas normas puede resultar en la suspensión inmediata de tu cuenta y, 
            en casos graves, acciones legales.
          </p>
        </section>

        <section>
          <h2>5. Propiedad intelectual</h2>
          <p>
            <strong>Contenido de Aeternum:</strong> Todo el contenido, diseño, código, logos, marcas y 
            materiales de la plataforma son propiedad de Aeternum y están protegidos por leyes de 
            propiedad intelectual. No puedes copiar, modificar, distribuir o reproducir ningún elemento 
            sin autorización previa por escrito.
          </p>
          <p>
            <strong>Contenido de libros:</strong> Los libros, portadas y metadatos provienen de OpenLibrary 
            y otros proveedores de contenido. Los derechos de autor pertenecen a sus respectivos autores 
            y editores. Aeternum no reclama propiedad sobre este contenido.
          </p>
        </section>

        <section>
          <h2>6. Contenido de terceros (OpenLibrary)</h2>
          <p>
            Aeternum actúa como intermediario hacia la API de OpenLibrary. Por lo tanto:
          </p>
          <ul>
            <li>No garantizamos la disponibilidad continua de libros específicos.</li>
            <li>No controlamos el contenido, calidad o exactitud de los libros proporcionados por OpenLibrary.</li>
            <li>Los términos de préstamo, descarga y uso están sujetos a las políticas de OpenLibrary.</li>
            <li>No somos responsables por cambios en la disponibilidad o funcionalidades de OpenLibrary.</li>
          </ul>
          <p>
            Para más información sobre OpenLibrary, visita{" "}
            <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">
              openlibrary.org
            </a>
          </p>
        </section>

        <section>
          <h2>7. Limitación de responsabilidad</h2>
          <p>
            Aeternum se proporciona "tal cual está" y "según disponibilidad". En la máxima medida permitida 
            por la ley, no garantizamos:
          </p>
          <ul>
            <li>Que el servicio estará disponible de forma ininterrumpida o libre de errores.</li>
            <li>Que los defectos serán corregidos inmediatamente.</li>
            <li>Que el servicio cumplirá con tus expectativas específicas.</li>
            <li>La exactitud, fiabilidad o integridad del contenido de terceros.</li>
          </ul>
          <p>
            <strong>No seremos responsables por:</strong>
          </p>
          <ul>
            <li>Pérdida de datos, incluyendo listas de deseos o configuraciones de usuario.</li>
            <li>Daños directos, indirectos, incidentales o consecuentes derivados del uso del servicio.</li>
            <li>Problemas causados por fallos de OpenLibrary o servicios de terceros.</li>
            <li>Acciones de otros usuarios de la plataforma.</li>
          </ul>
        </section>

        <section>
          <h2>8. Suspensión y terminación de cuenta</h2>
          <p>
            <strong>Suspensión por nuestra parte:</strong> Nos reservamos el derecho de suspender o 
            eliminar tu cuenta si:
          </p>
          <ul>
            <li>Violas estos Términos de Servicio.</li>
            <li>Realizas actividades fraudulentas o ilegales.</li>
            <li>Proporcionas información falsa durante el registro.</li>
            <li>Tu cuenta permanece inactiva por más de 2 años.</li>
          </ul>
          <p>
            <strong>Terminación por tu parte:</strong> Puedes eliminar tu cuenta en cualquier momento 
            desde la configuración de tu perfil o escribiéndonos a{" "}
            <a href="mailto:aeternum538@gmail.com">aeternum538@gmail.com</a>
          </p>
          <p>
            Al cerrar tu cuenta, tus datos personales serán eliminados conforme a nuestra Política de Privacidad.
          </p>
        </section>

        <section>
          <h2>9. Modificaciones del servicio y términos</h2>
          <p>
            Nos reservamos el derecho de:
          </p>
          <ul>
            <li>Modificar, suspender o descontinuar cualquier funcionalidad del servicio en cualquier momento.</li>
            <li>Actualizar estos Términos de Servicio cuando sea necesario.</li>
            <li>Cambiar la estructura de precios (si en el futuro implementamos planes de pago).</li>
          </ul>
          <p>
            Te notificaremos sobre cambios importantes mediante correo electrónico o avisos en la plataforma. 
            El uso continuado del servicio después de las modificaciones implica tu aceptación de los nuevos términos.
          </p>
        </section>

        <section>
          <h2>10. Ley aplicable y jurisdicción</h2>
          <p>
            Estos Términos de Servicio se rigen por las leyes de la <strong>República de Colombia</strong>. 
            Cualquier disputa o reclamación relacionada con el uso de Aeternum será sometida a la jurisdicción 
            exclusiva de los tribunales competentes de <strong>Bogotá, Colombia</strong>.
          </p>
        </section>

        <section>
          <h2>11. Indemnización</h2>
          <p>
            Aceptas indemnizar y eximir de responsabilidad a Aeternum, sus directores, empleados y afiliados 
            de cualquier reclamación, pérdida, daño, responsabilidad o gasto (incluidos honorarios legales) 
            derivados de:
          </p>
          <ul>
            <li>Tu uso indebido de la plataforma.</li>
            <li>Violación de estos Términos de Servicio.</li>
            <li>Violación de derechos de terceros.</li>
            <li>Cualquier actividad realizada desde tu cuenta.</li>
          </ul>
        </section>

        <section>
          <h2>12. Disposiciones generales</h2>
          <p>
            <strong>Divisibilidad:</strong> Si alguna disposición de estos términos se considera inválida 
            o inaplicable, el resto de las disposiciones permanecerán en pleno vigor.
          </p>
          <p>
            <strong>Renuncia:</strong> El hecho de que no ejerzamos un derecho bajo estos términos no 
            constituye una renuncia a ese derecho.
          </p>
          <p>
            <strong>Acuerdo completo:</strong> Estos Términos de Servicio, junto con nuestra Política de 
            Privacidad, constituyen el acuerdo completo entre tú y Aeternum.
          </p>
        </section>

        <section>
          <h2>13. Contacto y soporte</h2>
          <p>
            Si tienes preguntas, comentarios o necesitas reportar un problema relacionado con estos 
            Términos de Servicio, puedes contactarnos:
          </p>
          <ul>
            <li>
              <strong>Correo electrónico:</strong>{" "}
              <a href="mailto:aeternum538@gmail.com">aeternum538@gmail.com</a>
            </li>
            <li>
              <strong>Documentación y ayuda:</strong>{" "}
              <a href="https://santixxtt.github.io/Documentacion-Aeternum/" target="_blank" rel="noopener noreferrer">
                Documentación Aeternum
              </a>
            </li>
          </ul>
          <p>
            Nos comprometemos a responder tus consultas en un plazo máximo de 5 días hábiles.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default TerminosServicio;