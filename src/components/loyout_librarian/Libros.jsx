import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaTimes,
  FaSave,
  FaUpload,
  FaImage,
  FaTrash,
} from "react-icons/fa";
import "../../assets/css/libros.css";
import Header from "./header";
import HeaderMovil from "./HeaderMovil";
import Footer from "../loyout_reusable/footer";

const Libros = () => {
  const navigate = useNavigate();
  const [libros, setLibros] = useState([]);
  const [autores, setAutores] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [creatingBook, setCreatingBook] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [usuario, setUsuario] = useState(null);
  
  // Estados para manejo de imágenes
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    autor_id: "",
    editorial_id: "",
    genero_id: "",
    fecha_publicacion: "",
    cantidad_disponible: 1,
    openlibrary_key: "",
    cover_id: "",
    imagen_local: null,
  });

  const API_BASE = "http://10.17.0.28:8000";
  const BOOKS_BASE = `${API_BASE}/admin/books`;
  const UPLOADS_BASE = `${API_BASE}/uploads`;

  const getToken = () =>
    localStorage.getItem("token") || localStorage.getItem("access_token") || "";

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/");
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/users/me`, {
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

    fetchCurrentUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const fetchLibros = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${BOOKS_BASE}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Error HTTP ${res.status}`);
      }

      const json = await res.json();

      if (Array.isArray(json)) {
        setLibros(json);
      } else if (Array.isArray(json.libros)) {
        setLibros(json.libros);
      } else if (Array.isArray(json.data)) {
        setLibros(json.data);
      } else {
        const arr = Object.values(json).find((v) => Array.isArray(v));
        if (arr) {
          setLibros(arr);
        } else {
          setLibros([]);
        }
      }
    } catch (err) {
      console.error("fetchLibros error:", err);
      alert("Error al cargar libros: " + err.message);
      setLibros([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogos = async () => {
    try {
      const token = getToken();

      const resAutores = await fetch(`${API_BASE}/autores/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resAutores.ok) {
        const dataAutores = await resAutores.json();
        setAutores(Array.isArray(dataAutores) ? dataAutores : []);
      }

      const resEditoriales = await fetch(`${API_BASE}/editoriales/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resEditoriales.ok) {
        const dataEditoriales = await resEditoriales.json();
        setEditoriales(Array.isArray(dataEditoriales) ? dataEditoriales : []);
      }

      const resGeneros = await fetch(`${API_BASE}/generos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resGeneros.ok) {
        const dataGeneros = await resGeneros.json();
        setGeneros(Array.isArray(dataGeneros) ? dataGeneros : []);
      }
    } catch (err) {
      console.error("fetchCatalogos error:", err);
    }
  };

  useEffect(() => {
    fetchLibros();
    fetchCatalogos();
  }, []);

  // Manejo de imagen
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Formato no válido. Use: JPG, PNG, WEBP o GIF');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo: 5MB');
      return;
    }

    setSelectedImage(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', selectedImage);

      const res = await fetch(`${UPLOADS_BASE}/book-cover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Error al subir imagen');
      }

      const data = await res.json();
      return data.path; // Retorna la ruta relativa para guardar en BD
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      showNotification('Error al subir imagen: ' + error.message, 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData({ ...formData, imagen_local: null });
  };

  const formatYearDisplay = (fecha) => {
    if (!fecha) return "-";
    const year = String(fecha);
    return year.length === 4 ? year : year.split('-')[0];
  };

  const getBookCoverUrl = (libro) => {
    // Prioridad: imagen local > OpenLibrary cover
    if (libro.imagen_local) {
      // Si la ruta ya incluye 'book_covers/', construir URL completa
      // Si no, asumir que es la ruta completa desde uploads/
      const imagePath = libro.imagen_local.startsWith('book_covers/') 
        ? libro.imagen_local 
        : libro.imagen_local.replace('uploads/', '');
      
      const fullUrl = `${UPLOADS_BASE}/${imagePath}`;
      console.log('🖼️ URL de imagen generada:', fullUrl);
      console.log('🖼️ imagen_local desde BD:', libro.imagen_local);
      
      return fullUrl;
    } else if (libro.cover_id) {
      return `https://covers.openlibrary.org/b/id/${libro.cover_id}-M.jpg`;
    }
    return null;
  };

  const handleToggleStatus = async (libro) => {
    const isActive = libro.estado === "Activo";
    const action = isActive ? "desactivar" : "activar";
    const message = isActive ? "desactivar" : "activar";

    if (!window.confirm(`¿Seguro que deseas ${message} este libro?`)) return;

    setProcessingId(libro.id);

    const nuevoEstado = isActive ? "Desactivado" : "Activo";
    const estadoOriginal = libro.estado;

    setLibros((prev) =>
      prev.map((l) =>
        l.id === libro.id ? { ...l, estado: nuevoEstado } : l
      )
    );

    try {
      const token = getToken();
      const res = await fetch(`${BOOKS_BASE}/${action}/${libro.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        setLibros((prev) =>
          prev.map((l) =>
            l.id === libro.id ? { ...l, estado: estadoOriginal } : l
          )
        );
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Error ${res.status}`);
      }

      const data = await res.json();

      if (data.status !== "warning") {
        showNotification(
          `Libro ${nuevoEstado.toLowerCase()} correctamente`,
          "success"
        );
      }
    } catch (err) {
      console.error("handleToggleStatus error:", err);
      showNotification(`Error al ${message} libro: ${err.message}`, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (libro) => {
    setEditingBook(libro);
    setCreatingBook(false);
    
    // Convertir año a formato fecha para el input
    let fechaFormateada = "";
    if (libro.fecha_publicacion) {
      const year = String(libro.fecha_publicacion);
      // Si solo es el año, convertir a formato YYYY-01-01 para el input date
      fechaFormateada = year.length === 4 ? `${year}-01-01` : year;
    }
    
    setFormData({
      titulo: libro.titulo || "",
      descripcion: libro.descripcion || "",
      autor_id: libro.autor_id || "",
      editorial_id: libro.editorial_id || "",
      genero_id: libro.genero_id || "",
      fecha_publicacion: fechaFormateada,
      cantidad_disponible: libro.cantidad_disponible || 1,
      openlibrary_key: libro.openlibrary_key || "",
      cover_id: libro.cover_id || "",
      imagen_local: libro.imagen_local || null,
    });

    // Cargar preview si tiene imagen local
    if (libro.imagen_local) {
      setImagePreview(getBookCoverUrl(libro));
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null);
  };

  const handleCreate = () => {
    setCreatingBook(true);
    setEditingBook(null);
    setFormData({
      titulo: "",
      descripcion: "",
      autor_id: "",
      editorial_id: "",
      genero_id: "",
      fecha_publicacion: "",
      cantidad_disponible: 1,
      openlibrary_key: "",
      cover_id: "",
      imagen_local: null,
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const closeModal = () => {
    setEditingBook(null);
    setCreatingBook(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!editingBook) {
      console.error('No hay libro en edición');
      showNotification("Error: No hay libro seleccionado para editar", "error");
      return;
    }

    // Validar campos obligatorios
    if (!formData.titulo || !formData.autor_id || !formData.editorial_id || !formData.genero_id) {
      showNotification("Por favor completa todos los campos obligatorios", "error");
      return;
    }

    try {
      let imagePath = formData.imagen_local;

      // Si se seleccionó una nueva imagen, subirla
      if (selectedImage) {
        imagePath = await uploadImage();
        if (!imagePath && selectedImage) {
          // Si falló la subida, no continuar
          return;
        }
      }

      const token = getToken();
      
      // Manejo seguro de fecha_publicacion
      let year = null;
      if (formData.fecha_publicacion) {
        const fechaStr = String(formData.fecha_publicacion);
        year = fechaStr.includes('-') ? fechaStr.split('-')[0] : fechaStr;
      }

      console.log('📤 Enviando actualización para libro ID:', editingBook.id);
      console.log('📤 Datos:', {
        titulo: formData.titulo,
        autor_id: parseInt(formData.autor_id),
        editorial_id: parseInt(formData.editorial_id),
        genero_id: parseInt(formData.genero_id),
        fecha_publicacion: year ? parseInt(year) : null,
        cantidad_disponible: parseInt(formData.cantidad_disponible),
        imagen_local: imagePath,
      });
      
      const res = await fetch(`${BOOKS_BASE}/${editingBook.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          autor_id: parseInt(formData.autor_id),
          editorial_id: parseInt(formData.editorial_id),
          genero_id: parseInt(formData.genero_id),
          fecha_publicacion: year ? parseInt(year) : null,
          cantidad_disponible: parseInt(formData.cantidad_disponible),
          openlibrary_key: formData.openlibrary_key || null,
          cover_id: formData.cover_id ? parseInt(formData.cover_id) : 0,
          imagen_local: imagePath,
        }),
      });

      console.log('📥 Respuesta del servidor:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error('❌ Error del servidor:', errorData);
        
        if (res.status === 404) {
          throw new Error(`El libro con ID ${editingBook.id} no existe en la base de datos`);
        }
        
        throw new Error(errorData?.detail || `Error ${res.status}: ${res.statusText}`);
      }

      const responseData = await res.json();
      console.log('✅ Libro actualizado:', responseData);

      // Actualizar el estado local solo después de confirmar éxito
      await fetchLibros();
      closeModal();
      showNotification("Libro actualizado correctamente", "success");

    } catch (err) {
      console.error("handleSave error:", err);
      showNotification("Error al actualizar libro: " + err.message, "error");
      // Recargar datos para sincronizar con el servidor
      await fetchLibros();
    }
  };

  const handleCreateBook = async () => {
    if (
      !formData.titulo ||
      !formData.autor_id ||
      !formData.editorial_id ||
      !formData.genero_id
    ) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    let imagePath = null;

    // Si se seleccionó una imagen, subirla
    if (selectedImage) {
      imagePath = await uploadImage();
      if (!imagePath) {
        // Si falló la subida, no continuar
        return;
      }
    }

    closeModal();

    try {
      const token = getToken();
      
      // Manejo seguro de fecha_publicacion
      let year = null;
      if (formData.fecha_publicacion) {
        const fechaStr = String(formData.fecha_publicacion);
        year = fechaStr.includes('-') ? fechaStr.split('-')[0] : fechaStr;
      }
      
      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        autor_id: parseInt(formData.autor_id),
        editorial_id: parseInt(formData.editorial_id),
        genero_id: parseInt(formData.genero_id),
        fecha_publicacion: year ? parseInt(year) : null,
        cantidad_disponible: parseInt(formData.cantidad_disponible) || 1,
        openlibrary_key: formData.openlibrary_key?.trim() || null,
        cover_id: formData.cover_id ? parseInt(formData.cover_id) : 0,
        imagen_local: imagePath,
      };

      const res = await fetch(BOOKS_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Error del servidor:", error);
        throw new Error(error.detail || JSON.stringify(error));
      }

      const newBook = await res.json();

      const autorNombre = autores.find((a) => a.id === parseInt(formData.autor_id))?.nombre || "";
      const editorialNombre = editoriales.find((e) => e.id === parseInt(formData.editorial_id))?.nombre || "";
      const generoNombre = generos.find((g) => g.id === parseInt(formData.genero_id))?.nombre || "";

      setLibros((prev) => [
        {
          id: newBook.libro_id || Date.now(),
          ...formData,
          estado: "Activo",
          autor_nombre: autorNombre,
          editorial_nombre: editorialNombre,
          genero_nombre: generoNombre,
          imagen_local: imagePath,
        },
        ...prev,
      ]);

      showNotification("Libro creado correctamente", "success");
      setTimeout(() => fetchLibros(), 1000);
    } catch (err) {
      console.error("handleCreateBook error:", err);
      showNotification("Error al crear libro: " + err.message, "error");
      await fetchLibros();
    }
  };

  const showNotification = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  const handleExport = async (tipo) => {
    const token = getToken();

    if (!token) {
      showNotification("❌ No estás autenticado", "error");
      return;
    }

    try {
      showNotification(`⏳ Generando archivo ${tipo.toUpperCase()}...`, "info");

      const endpoint =
        tipo === "excel"
          ? `${BOOKS_BASE}/export/excel`
          : `${BOOKS_BASE}/export/pdf`;

      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al exportar: ${res.status} - ${errorText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      a.download = `libros_${timestamp}.${tipo === "excel" ? "xlsx" : "pdf"}`;

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      showNotification(
        `✅ Archivo ${tipo.toUpperCase()} descargado correctamente`,
        "success"
      );
    } catch (error) {
      console.error("❌ Error completo:", error);
      showNotification(`❌ Error al exportar: ${error.message}`, "error");
    }
  };

  const filteredBooks = Array.isArray(libros)
    ? libros.filter((l) =>
        `${l.titulo || ""} ${l.autor_nombre || ""} ${l.editorial_nombre || ""} ${
          l.genero_nombre || ""
        }`
          .toLowerCase()
          .includes(busqueda.toLowerCase())
      )
    : [];

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkDevice = () => {
      const mobile =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return (
    <div className="dashboard-user">
      {isMobile ? (
        <HeaderMovil onLogout={handleLogout} usuario={usuario} />
      ) : (
        <Header onLogout={handleLogout} usuario={usuario} />
      )}

      <div className="libros-container">
        <div className="libros-header">
          <h2>Gestión de Libros</h2>
          <div className="libros-actions">
            <div className="libros-search">
              <FaSearch className="libros-search-icon" />
              <input
                type="text"
                placeholder="Buscar libro..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button
              className="libros-btn create"
              onClick={handleCreate}
              title="Crear Libro"
            >
              <i className="bx bx-book-add"></i>
            </button>
            <button
              className="libros-btn excel"
              onClick={() => handleExport("excel")}
              title="Exportar a Excel"
            >
              <FaFileExcel />
            </button>
            <button
              className="libros-btn pdf"
              onClick={() => handleExport("pdf")}
              title="Exportar a PDF"
            >
              <FaFilePdf />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="libros-loading">Cargando libros...</p>
        ) : (
          <div className="libros-table-wrapper">
            <table className="libros-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>PORTADA</th>
                  <th>TÍTULO</th>
                  <th>AUTOR</th>
                  <th>EDITORIAL</th>
                  <th>GÉNERO</th>
                  <th>F. PUBLICACIÓN</th>
                  <th>DISPONIBLES</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((l) => (
                    <tr
                      key={l.id}
                      className={processingId === l.id ? "processing" : ""}
                    >
                      <td>{l.id}</td>
                      <td>
                        <div className="book-cover-thumbnail">
                          {getBookCoverUrl(l) ? (
                            <img 
                              src={getBookCoverUrl(l)} 
                              alt={l.titulo}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/50x75?text=Sin+portada';
                              }}
                            />
                          ) : (
                            <div className="no-cover">
                              <FaImage />
                            </div>
                          )}
                        </div>
                      </td>

                      <td>{l.titulo}</td>
                      <td>{l.autor_nombre || "-"}</td>
                      <td>{l.editorial_nombre || "-"}</td>
                      <td>{l.genero_nombre || "-"}</td>
                      <td>{formatYearDisplay(l.fecha_publicacion)}</td>
                      <td>{l.cantidad_disponible}</td>

                      <td>
                        <div className="estado-toggle-wrapper">
                          <button
                            className={`estado-toggle-btn ${
                              l.estado === "Activo" ? "active" : "inactive"
                            }`}
                            onClick={() => handleToggleStatus(l)}
                            disabled={processingId === l.id}
                          >
                            {processingId === l.id ? (
                              <i className="bx bx-loader-alt bx-spin"></i>
                            ) : (
                              <i
                                className={`bx ${
                                  l.estado === "Activo"
                                    ? "bx-toggle-right"
                                    : "bx-toggle-left"
                                }`}
                              ></i>
                            )}
                            <span>
                              {l.estado === "Activo" ? "Activo" : "Inactivo"}
                            </span>
                          </button>
                        </div>
                      </td>

                      <td>
                        <div className="acciones-wrapper">
                          <button
                            className="accion-btn edit"
                            onClick={() => handleEdit(l)}
                            disabled={processingId === l.id}
                          >
                            <i className="bx bx-pencil"></i>
                            <span>Editar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="libros-empty">
                      {libros.length === 0
                        ? "No hay libros registrados."
                        : "No hay libros que coincidan con la búsqueda."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {(editingBook || creatingBook) && (
          <div className="libros-modal-overlay">
            <div className="libros-modal">
              <div className="libros-modal-header">
                <h3>
                  {creatingBook
                    ? "Crear Libro"
                    : `Editar Libro #${editingBook.id}`}
                </h3>
                <button className="libros-modal-close" onClick={closeModal}>
                  <FaTimes />
                </button>
              </div>

              <div className="libros-modal-body">
                {/* SECCIÓN DE IMAGEN */}
                <div className="image-upload-section">
                  <label>Portada del Libro</label>
                  
                  <div className="image-upload-container">
                    {imagePreview ? (
                      <div className="image-preview-wrapper">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="image-preview"
                        />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={clearImage}
                          title="Eliminar imagen"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ) : (
                      <div className="image-upload-placeholder">
                        <FaImage className="placeholder-icon" />
                        <p>Sin portada</p>
                      </div>
                    )}
                    
                    <div className="image-upload-controls">
                      <input
                        type="file"
                        id="imageInput"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="imageInput" className="upload-image-btn">
                        <FaUpload /> {imagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                      </label>
                      <p className="image-upload-hint">
                        JPG, PNG, WEBP o GIF (máx. 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                <label>Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                />

                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  rows="3"
                />

                <label>Autor *</label>
                <select
                  value={formData.autor_id}
                  onChange={(e) =>
                    setFormData({ ...formData, autor_id: e.target.value })
                  }
                >
                  <option value="">Seleccione un autor...</option>
                  {autores.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>

                <label>Editorial *</label>
                <select
                  value={formData.editorial_id}
                  onChange={(e) =>
                    setFormData({ ...formData, editorial_id: e.target.value })
                  }
                >
                  <option value="">Seleccione una editorial...</option>
                  {editoriales.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>

                <label>Género *</label>
                <select
                  value={formData.genero_id}
                  onChange={(e) =>
                    setFormData({ ...formData, genero_id: e.target.value })
                  }
                >
                  <option value="">Seleccione un género...</option>
                  {generos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>

                <label>Fecha de Publicación</label>
                <input
                  type="date"
                  value={formData.fecha_publicacion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fecha_publicacion: e.target.value,
                    })
                  }
                />

                <label>Cantidad Disponible *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.cantidad_disponible}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cantidad_disponible: e.target.value,
                    })
                  }
                />

                <label>OpenLibrary Key (opcional)</label>
                <input
                  type="text"
                  value={formData.openlibrary_key}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      openlibrary_key: e.target.value,
                    })
                  }
                  placeholder="Ej: /works/OL45804W"
                />

                <label>Cover ID (opcional)</label>
                <input
                  type="text"
                  value={formData.cover_id}
                  onChange={(e) =>
                    setFormData({ ...formData, cover_id: e.target.value })
                  }
                  placeholder="Ej: 8739161"
                />
              </div>

              <div className="libros-modal-footer">
                <button
                  className="libros-modal-btn save"
                  onClick={creatingBook ? handleCreateBook : handleSave}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <>
                      <i className="bx bx-loader-alt bx-spin"></i> Subiendo...
                    </>
                  ) : (
                    <>
                      <FaSave /> {creatingBook ? "Crear" : "Guardar"}
                    </>
                  )}
                </button>
                <button
                  className="libros-modal-btn cancel"
                  onClick={closeModal}
                  disabled={uploadingImage}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Libros;