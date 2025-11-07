import { useState, useEffect } from "react";
import defaultImage from "../../assets/img/book-placeholder.png";
import "../../assets/css/physical_loan_modal.css";

export default function PhysicalLoanModal({ book, usuario, onClose }) {
  const [fechaRecogida, setFechaRecogida] = useState("");
  const [loading, setLoading] = useState(false);
  const [libroId, setLibroId] = useState(null);
  const [checkingBook, setCheckingBook] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Calcular fecha de devolución (+12 días)
  const calcularFechaDevolucion = (fechaRec) => {
    if (!fechaRec) return "";
    const fecha = new Date(fechaRec + "T00:00:00");
    fecha.setDate(fecha.getDate() + 12);
    return fecha.toISOString().split("T")[0];
  };

  const fechaDevolucion = calcularFechaDevolucion(fechaRecogida);

  // Fecha mínima (hoy) y máxima (30 días)
  const hoy = new Date().toISOString().split("T")[0];
  const maxFecha = new Date();
  maxFecha.setDate(maxFecha.getDate() + 30);
  const maxFechaStr = maxFecha.toISOString().split("T")[0];

  // ✅ VERIFICAR/CREAR LIBRO AL MONTAR EL COMPONENTE
  useEffect(() => {
    const verificarOCrearLibro = async () => {
      const token = localStorage.getItem("token");
      const openlibrary_key = book.key?.replace("/works/", "") || book.openlibrary_key;

      console.log("🔍 Verificando libro en BD con key:", openlibrary_key);

      try {
        // 1️⃣ Intentar buscar el libro por openlibrary_key
        const searchRes = await fetch(
          `http://127.0.0.1:8000/wishlist/buscar-libro/${openlibrary_key}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (searchRes.ok) {
          const data = await searchRes.json();
          console.log("✅ Libro encontrado en BD:", data);
          
          // Verificar si tiene cantidad disponible
          if (data.libro?.cantidad_disponible > 0) {
            setLibroId(data.libro_id || data.libro?.id);
            setCheckingBook(false);
            return;
          } else {
            setErrorMessage("Este libro no tiene copias disponibles para préstamo físico");
            setCheckingBook(false);
            return;
          }
        }

        // 2️⃣ Si no existe, crearlo usando ensure_book_for_loan
        console.log("📚 Libro no encontrado, creando en BD...");
        
        const createRes = await fetch("http://127.0.0.1:8000/wishlist/ensure-book-for-loan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            titulo: book.title,
            autor: book.author_name?.[0] || "Desconocido",
            openlibrary_key: openlibrary_key,
            cover_id: book.cover_i || null,
          }),
        });

        if (createRes.ok) {
          const createData = await createRes.json();
          console.log("✅ Libro procesado exitosamente:", createData);
          
          if (createData.cantidad_disponible > 0) {
            setLibroId(createData.libro_id);
          } else {
            setErrorMessage("Este libro no tiene copias disponibles para préstamo físico");
          }
        } else {
          const errorData = await createRes.json();
          console.error("❌ Error al procesar libro:", errorData);
          setErrorMessage("No se pudo registrar el libro en la biblioteca");
        }

      } catch (error) {
        console.error("❌ Error verificando/creando libro:", error);
        setErrorMessage("Error de conexión al verificar disponibilidad");
      } finally {
        setCheckingBook(false);
      }
    };

    verificarOCrearLibro();
  }, [book]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fechaRecogida) {
      alert("Por favor selecciona una fecha de recogida");
      return;
    }

    if (!libroId) {
      alert("Error: No se pudo identificar el libro");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    const requestBody = {
      libro_id: libroId, // ✅ Ahora tenemos el ID correcto
      openlibrary_key: book.key?.replace("/works/", "") || book.openlibrary_key || "",
      titulo: book.title || book.titulo,
      autor: book.author_name?.[0] || book.autor || "Desconocido",
      fecha_recogida: fechaRecogida,
    };

    console.log("📤 Body a enviar:", requestBody);

    try {
      const res = await fetch("http://127.0.0.1:8000/prestamos-fisicos/solicitar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("📥 Respuesta:", data);

      if (!res.ok) {
        console.error("❌ Error del servidor:", data);
        const errorMsg = data.detail?.[0]?.msg || data.detail || data.message || "Error desconocido";
        throw new Error(errorMsg);
      }

      alert(`✅ Préstamo físico confirmado!\n\n📅 Recoge tu libro: ${fechaRecogida}\n📆 Devuélvelo antes de: ${fechaDevolucion}\n\n📧 Te enviamos un correo de confirmación.`);
      onClose();

    } catch (error) {
      console.error("Error al solicitar préstamo físico:", error);
      alert(`❌ ${error.message}\n\nNo se pudo procesar tu solicitud.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("physical-loan-overlay")) {
      onClose();
    }
  };

  const imageUrl = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
    : defaultImage;

  // ✅ MOSTRAR LOADING MIENTRAS VERIFICA EL LIBRO
  if (checkingBook) {
    return (
      <div className="physical-loan-overlay" onClick={handleOverlayClick} style={{ alignItems: 'center' }}>
        <div className="physical-loan-content" style={{ margin: 'auto' }}>
          <button className="physical-loan-close" onClick={onClose}>
            <i className="bx bx-x"></i>
          </button>
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: "3rem" }}></i>
            <h3 style={{ marginTop: "1rem" }}>Verificando disponibilidad...</h3>
            <p style={{ color: "#666" }}>Consultando la biblioteca</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ MOSTRAR ERROR SI NO SE PUDO VERIFICAR EL LIBRO
  if (errorMessage) {
    return (
      <div className="physical-loan-overlay" onClick={handleOverlayClick} style={{ alignItems: 'center' }}>
        <div className="physical-loan-content" style={{ margin: 'auto' }}>
          <button className="physical-loan-close" onClick={onClose}>
            <i className="bx bx-x"></i>
          </button>
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <i className="bx bx-error-circle" style={{ fontSize: "3rem", color: "#e74c3c" }}></i>
            <h3 style={{ marginTop: "1rem", color: "#e74c3c" }}>No disponible</h3>
            <p style={{ marginTop: "0.5rem" }}>{errorMessage}</p>
            <button 
              onClick={onClose}
              style={{ 
                marginTop: "1.5rem", 
                padding: "0.75rem 1.5rem",
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="physical-loan-overlay" onClick={handleOverlayClick}>
      <div className="physical-loan-content">
        <button className="physical-loan-close" onClick={onClose}>
          <i className="bx bx-x"></i>
        </button>

        <h2 className="physical-loan-title">Solicitud de Préstamo Físico</h2>

        <div className="physical-loan-body">
          <div className="physical-loan-image">
            <img
              src={imageUrl}
              alt={book.title || book.titulo}
              onError={(e) => {
                if (e.target.src !== defaultImage) {
                  e.target.src = defaultImage;
                }
              }}
            />
          </div>

          <div className="physical-loan-info">
            <div className="loan-info-section">
              <h3>Detalles del Libro</h3>
              <p><strong>Título:</strong> {book.title || book.titulo}</p>
              <p><strong>Autor:</strong> {book.author_name?.[0] || book.autor || "Desconocido"}</p>
            </div>

            <div className="loan-info-section">
              <h3>Usuario</h3>
              <p><strong>Nombre:</strong> {usuario?.nombre} {usuario?.apellido}</p>
              <p><strong>Correo:</strong> {usuario?.correo}</p>
            </div>

            <div className="loan-form">
              <div className="loan-info-section">
                <h3>Fechas del Préstamo</h3>
                
                <div className="form-group">
                  <label htmlFor="fechaRecogida">
                    <i className="bx bx-calendar"></i> Fecha de Recogida
                  </label>
                  <input
                    type="date"
                    id="fechaRecogida"
                    value={fechaRecogida}
                    onChange={(e) => setFechaRecogida(e.target.value)}
                    min={hoy}
                    max={maxFechaStr}
                    required
                  />
                  <small>Selecciona cuándo recogerás el libro</small>
                </div>

                {fechaRecogida && (
                  <div className="form-group devolucion-info">
                    <label>
                      <i className="bx bx-calendar-check"></i> Fecha de Devolución
                    </label>
                    <div className="fecha-calculada">
                      {new Date(fechaDevolucion + "T00:00:00").toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <small className="prestamo-duracion">
                      ⏱ Tendrás 12 días para disfrutar este libro
                    </small>
                  </div>
                )}
              </div>

              <div className="loan-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-cancel"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-confirm"
                  disabled={loading || !fechaRecogida}
                >
                  {loading ? (
                    <>
                      <i className="bx bx-loader-alt bx-spin"></i> Procesando...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-check"></i> Confirmar Préstamo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}