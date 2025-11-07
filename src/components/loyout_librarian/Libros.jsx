import React, { useState, useEffect } from "react";
import {
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import "../../assets/css/libros.css";
import Header from "./header";
import HeaderMovil from "./HeaderMovil";
import Footer from "../loyout_reusable/footer";

const Libros = () => {
  const [libros, setLibros] = useState([]);
  const [autores, setAutores] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [creatingBook, setCreatingBook] = useState(false);
  const [processingId, setProcessingId] = useState(null);
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
  });

  const API_BASE = "http://192.168.1.2:8000";
  // const API_BASE = "http://192.168.1.2:8000";
  const BOOKS_BASE = `${API_BASE}/admin/books`;

  const getToken = () =>
    localStorage.getItem("token") || localStorage.getItem("access_token") || "";

  // ✅ Cargar datos iniciales
  useEffect(() => {
    fetchLibros();
    fetchAutores();
    fetchEditoriales();
    fetchGeneros();
  }, []);

  // ✅ Obtener todos los libros
  const fetchLibros = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${BOOKS_BASE}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();
      
      setLibros(Array.isArray(json) ? json : json.libros || json.data || []);
    } catch (err) {
      console.error("Error fetchLibros:", err);
      alert("Error al cargar libros: " + err.message);
      setLibros([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Obtener autores
  const fetchAutores = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/autores/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar autores");
      const data = await res.json();
      setAutores(Array.isArray(data) ? data : data.autores || []);
    } catch (err) {
      console.error("Error fetchAutores:", err);
      setAutores([]);
    }
  };

  // ✅ Obtener editoriales
  const fetchEditoriales = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/editoriales/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar editoriales");
      const data = await res.json();
      setEditoriales(Array.isArray(data) ? data : data.editoriales || []);
    } catch (err) {
      console.error("Error fetchEditoriales:", err);
      setEditoriales([]);
    }
  };

  // ✅ Obtener géneros
  const fetchGeneros = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/generos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar géneros");
      const data = await res.json();
      setGeneros(Array.isArray(data) ? data : data.generos || []);
    } catch (err) {
      console.error("Error fetchGeneros:", err);
      setGeneros([]);
    }
  };

  // ✅ Alternar estado del libro (Activar/Desactivar) - OPTIMISTA
  const handleToggleStatus = async (libro) => {
    const isActive = libro.estado === "Activo";
    const action = isActive ? "desactivar" : "activar";
    
    if (!window.confirm(`¿Seguro que deseas ${action} este libro?`)) return;
    
    setProcessingId(libro.id);
    
    // 🚀 Actualización optimista
    const nuevoEstado = isActive ? "Desactivado" : "Activo";
    setLibros(prev => prev.map(l => 
      l.id === libro.id ? { ...l, estado: nuevoEstado } : l
    ));
    
    try {
      const token = getToken();
      const endpoint = isActive 
        ? `${BOOKS_BASE}/desactivar/${libro.id}` 
        : `${BOOKS_BASE}/activar/${libro.id}`;
      
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        // Revierte si falla
        setLibros(prev => prev.map(l => 
          l.id === libro.id ? { ...l, estado: libro.estado } : l
        ));
        throw new Error(`Error ${res.status}`);
      }
      
      showNotification(`Libro ${action} correctamente`, "success");
    } catch (err) {
      console.error("Error handleToggleStatus:", err);
      alert(`Error al ${action} libro: ` + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Editar libro (abrir modal)
  const handleEdit = (libro) => {
    setEditingBook(libro);
    setCreatingBook(false);
    setFormData({
      titulo: libro.titulo || "",
      descripcion: libro.descripcion || "",
      autor_id: libro.autor_id || "",
      editorial_id: libro.editorial_id || "",
      genero_id: libro.genero_id || "",
      fecha_publicacion: libro.fecha_publicacion || "",
      cantidad_disponible: libro.cantidad_disponible || 1,
      openlibrary_key: libro.openlibrary_key || "",
      cover_id: libro.cover_id || "",
    });
  };

  // ✅ Abrir modal para crear libro
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
    });
  };

  const closeModal = () => {
    setEditingBook(null);
    setCreatingBook(false);
  };

  // ✅ Guardar cambios (editar libro) - OPTIMISTA
  const handleSave = async () => {
    if (!editingBook) return;
    
    if (!formData.titulo || !formData.autor_id || !formData.editorial_id || !formData.genero_id) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    
    const updatedData = {
      ...editingBook,
      ...formData,
    };
    
    // 🚀 Actualización optimista
    setLibros(prev => prev.map(l => 
      l.id === editingBook.id ? updatedData : l
    ));
    closeModal();
    
    try {
      const token = getToken();
      const res = await fetch(`${BOOKS_BASE}/${editingBook.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        await fetchLibros();
        throw new Error(`Error ${res.status}`);
      }
      
      showNotification("Libro actualizado correctamente", "success");
    } catch (err) {
      console.error("Error handleSave:", err);
      alert("Error al actualizar libro: " + err.message);
    }
  };

  // ✅ Crear nuevo libro
  const handleCreateBook = async () => {
    if (!formData.titulo || !formData.autor_id || !formData.editorial_id || !formData.genero_id) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    closeModal();
    
    try {
      const token = getToken();
      const res = await fetch(BOOKS_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || `Error ${res.status}`);
      }

      const newBook = await res.json();
      
      // 🚀 Agrega el nuevo libro optimistamente
      setLibros(prev => [
        {
          id: newBook.libro_id || Date.now(),
          ...formData,
          estado: "Activo",
        },
        ...prev
      ]);
      
      showNotification("Libro creado correctamente", "success");
      setTimeout(() => fetchLibros(), 1000);
    } catch (err) {
      console.error("Error handleCreateBook:", err);
      alert("Error al crear libro: " + err.message);
      await fetchLibros();
    }
  };

  // ✅ Notificación toast
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

  // ✅ Exportar
  const handleExport = (tipo) => {
    alert(`Exportando ${tipo.toUpperCase()}...`);
  };

  // ✅ Filtro de búsqueda
  const filteredBooks = Array.isArray(libros) ? libros.filter((l) =>
    `${l.titulo || ""} ${l.autor_nombre || ""} ${l.editorial_nombre || ""} ${l.genero_nombre || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  ) : [];

  // ✅ Obtener nombre del autor
  const getAutorNombre = (autor_id) => {
    const autor = autores.find(a => a.id === autor_id);
    return autor ? autor.nombre : "-";
  };

  // ✅ Obtener nombre de editorial
  const getEditorialNombre = (editorial_id) => {
    const editorial = editoriales.find(e => e.id === editorial_id);
    return editorial ? editorial.nombre : "-";
  };

  // ✅ Obtener nombre de género
  const getGeneroNombre = (genero_id) => {
    const genero = generos.find(g => g.id === genero_id);
    return genero ? genero.nombre : "-";
  };

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
    <>
      {isMobile ? <HeaderMovil /> : <Header />}
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
              <i className='bx bx-book-add'></i>
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
                  <th>Título</th>
                  <th>Autor</th>
                  <th>Editorial</th>
                  <th>Género</th>
                  <th>Año</th>
                  <th>Disponibles</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((l) => (
                    <tr key={l.id} className={processingId === l.id ? "processing" : ""}>
                      <td>{l.id}</td>
                      <td>{l.titulo}</td>
                      <td>{l.autor_nombre || getAutorNombre(l.autor_id)}</td>
                      <td>{l.editorial_nombre || getEditorialNombre(l.editorial_id)}</td>
                      <td>{l.genero_nombre || getGeneroNombre(l.genero_id)}</td>
                      <td>{l.fecha_publicacion || "-"}</td>
                      <td className="text-center">{l.cantidad_disponible}</td>
                      <td>
                        <span
                          className={`libros-estado ${
                            l.estado === "Activo" ? "activo" : "inactivo"
                          }`}
                        >
                          {l.estado}
                        </span>
                      </td>
                      <td className="libros-actions-cell">
                        <button
                          className="libros-icon-btn edit"
                          onClick={() => handleEdit(l)}
                          title="Editar"
                          disabled={processingId === l.id}
                        >
                          <i className='bx bx-pencil'></i>
                        </button>
                        <button
                          className={`libros-icon-btn toggle ${
                            l.estado === "Activo" ? "active" : "inactive"
                          }`}
                          onClick={() => handleToggleStatus(l)}
                          title={l.estado === "Activo" ? "Desactivar" : "Activar"}
                          disabled={processingId === l.id}
                        >
                          {processingId === l.id ? (
                            <i className='bx bx-loader-alt bx-spin'></i>
                          ) : (
                            <i className={`bx ${
                              l.estado === "Activo" ? "bx-toggle-right" : "bx-toggle-left"
                            }`}></i>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="libros-empty">
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

        {/* ✅ Modal */}
        {(editingBook || creatingBook) && (
          <div className="libros-modal-overlay">
            <div className="libros-modal">
              <div className="libros-modal-header">
                <h3>{creatingBook ? "Crear Libro" : `Editar Libro #${editingBook.id}`}</h3>
                <button className="libros-modal-close" onClick={closeModal}>
                  <FaTimes />
                </button>
              </div>

              <div className="libros-modal-body">
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
                  rows="3"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Descripción del libro..."
                />

                <label>Autor *</label>
                <select
                  value={formData.autor_id}
                  onChange={(e) =>
                    setFormData({ ...formData, autor_id: e.target.value })
                  }
                >
                  <option value="">-- Seleccionar autor --</option>
                  {autores.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>

                <label>Editorial *</label>
                <select
                  value={formData.editorial_id}
                  onChange={(e) =>
                    setFormData({ ...formData, editorial_id: e.target.value })
                  }
                >
                  <option value="">-- Seleccionar editorial --</option>
                  {editoriales.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>

                <label>Género *</label>
                <select
                  value={formData.genero_id}
                  onChange={(e) =>
                    setFormData({ ...formData, genero_id: e.target.value })
                  }
                >
                  <option value="">-- Seleccionar género --</option>
                  {generos.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>

                <label>Año de publicación</label>
                <input
                  type="number"
                  min="1000"
                  max="2100"
                  value={formData.fecha_publicacion}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_publicacion: e.target.value })
                  }
                  placeholder="2024"
                />

                <label>Cantidad disponible</label>
                <input
                  type="number"
                  min="0"
                  value={formData.cantidad_disponible}
                  onChange={(e) =>
                    setFormData({ ...formData, cantidad_disponible: parseInt(e.target.value) || 0 })
                  }
                />

                <label>OpenLibrary Key</label>
                <input
                  type="text"
                  value={formData.openlibrary_key}
                  onChange={(e) =>
                    setFormData({ ...formData, openlibrary_key: e.target.value })
                  }
                  placeholder="OL12345W"
                />

                <label>Cover ID</label>
                <input
                  type="number"
                  value={formData.cover_id}
                  onChange={(e) =>
                    setFormData({ ...formData, cover_id: e.target.value })
                  }
                  placeholder="ID de portada"
                />
              </div>

              <div className="libros-modal-footer">
                <button 
                  className="libros-modal-btn save" 
                  onClick={creatingBook ? handleCreateBook : handleSave}
                >
                  <FaSave /> {creatingBook ? "Crear" : "Guardar"}
                </button>
                <button className="libros-modal-btn cancel" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Libros;