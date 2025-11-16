import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Importar useNavigate
import {
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import "../../assets/css/usuarios.css";
import Header from "./header";
import HeaderMovil from "./HeaderMovil";
import Footer from "../loyout_reusable/footer";

const Usuarios = () => {
  const navigate = useNavigate(); // ✅ Hook para navegación
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [usuario, setUsuario] = useState(null); // ✅ Estado para el usuario actual
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    clave: "",
    rol: "",
    tipo_identificacion: "",
    num_identificacion: "",
  });

  const API_BASE = "http://192.168.1.2:8000";
  const ADMIN_USERS_BASE = `${API_BASE}/admin/users`;
  const REGISTER_BASE = `${API_BASE}/auth/register`;

  const getToken = () =>
    localStorage.getItem("token") || localStorage.getItem("access_token") || "";

  // ✅ Cargar datos del usuario actual
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

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${ADMIN_USERS_BASE}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Error HTTP ${res.status}`);
      }

      const json = await res.json();

      if (Array.isArray(json)) {
        setUsuarios(json);
      } else if (Array.isArray(json.usuarios)) {
        setUsuarios(json.usuarios);
      } else if (Array.isArray(json.data)) {
        setUsuarios(json.data);
      } else {
        const arr = Object.values(json).find((v) => Array.isArray(v));
        if (arr) {
          setUsuarios(arr);
        } else {
          setUsuarios([]);
        }
      }
    } catch (err) {
      console.error("fetchUsuarios error:", err);
      alert("Error al cargar usuarios: " + err.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // ✅ Función handleLogout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const handleToggleStatus = async (usuario) => {
  // 🔥 Prevenir clics múltiples
  if (processingId === usuario.id) {
    showNotification("⏳ Espera a que termine la operación anterior", "warning");
    return;
  }

  const isActive = usuario.estado === "Activo";
  const action = isActive ? "desactivar" : "reactivar";
  const message = isActive ? "desactivar" : "reactivar";

  if (!window.confirm(`¿Seguro que deseas ${message} este usuario?`)) return;

  // Marcar como procesando ANTES de cualquier cambio
  setProcessingId(usuario.id);

  const nuevoEstado = isActive ? "Desactivado" : "Activo";

  try {
    const token = getToken();
    const res = await fetch(`${ADMIN_USERS_BASE}/${action}/${usuario.id}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.detail || `Error ${res.status}`);
    }

    const data = await res.json();
    
    // ✅ SOLO actualizar UI después de confirmación del servidor
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === usuario.id ? { ...u, estado: nuevoEstado } : u
      )
    );
    
    if (data.status !== "warning") {
      showNotification(
        `✅ Usuario ${nuevoEstado.toLowerCase()} correctamente`,
        "success"
      );
    }
  } catch (err) {
    console.error("handleToggleStatus error:", err);
    showNotification(`❌ Error al ${message} usuario: ${err.message}`, "error");
  } finally {
    // Liberar el bloqueo
    setProcessingId(null);
  }
};

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setCreatingUser(false);
    setFormData({
      nombre: usuario.nombre || "",
      apellido: usuario.apellido || "",
      correo: usuario.correo || "",
      clave: "",
      rol: usuario.rol || "",
      tipo_identificacion: usuario.tipo_identificacion || "",
      num_identificacion: usuario.num_identificacion || "",
    });
  };

  const handleCreate = () => {
    setCreatingUser(true);
    setEditingUser(null);
    setFormData({
      nombre: "",
      apellido: "",
      correo: "",
      clave: "",
      rol: "usuario",
      tipo_identificacion: "",
      num_identificacion: "",
    });
  };

  const closeModal = () => {
    setEditingUser(null);
    setCreatingUser(false);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    const updatedData = {
      ...editingUser,
      nombre: formData.nombre,
      apellido: formData.apellido,
      correo: formData.correo,
      tipo_identificacion: formData.tipo_identificacion,
      num_identificacion: formData.num_identificacion,
    };

    setUsuarios((prev) =>
      prev.map((u) => (u.id === editingUser.id ? updatedData : u))
    );
    closeModal();

    try {
      const token = getToken();
      const res = await fetch(`${ADMIN_USERS_BASE}/${editingUser.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo,
          tipo_identificacion: formData.tipo_identificacion,
          num_identificacion: formData.num_identificacion,
        }),
      });

      if (!res.ok) {
        await fetchUsuarios();
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Error ${res.status}`);
      }

      showNotification("Usuario actualizado correctamente", "success");
    } catch (err) {
      console.error("handleSave error:", err);
      showNotification("Error al actualizar usuario: " + err.message, "error");
    }
  };

  const handleCreateUser = async () => {
    if (
      !formData.nombre ||
      !formData.apellido ||
      !formData.correo ||
      !formData.clave
    ) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    closeModal();

    try {
      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        correo: formData.correo,
        clave: formData.clave,
        rol: formData.rol || "usuario",
        tipo_identificacion: formData.tipo_identificacion || "",
        num_identificacion: formData.num_identificacion || "",
        consent: true,
      };

      const res = await fetch(REGISTER_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Error del servidor:", error);
        throw new Error(error.detail || JSON.stringify(error));
      }

      const newUser = await res.json();
      
      setUsuarios((prev) => [
        {
          id: newUser.user_id || Date.now(),
          ...formData,
          estado: "Activo",
        },
        ...prev,
      ]);

      showNotification("Usuario creado correctamente", "success");
      setTimeout(() => fetchUsuarios(), 1000);
    } catch (err) {
      console.error("handleCreateUser error:", err);
      showNotification("Error al crear usuario: " + err.message, "error");
      await fetchUsuarios();
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
      
      const endpoint = tipo === 'excel' 
        ? `${ADMIN_USERS_BASE}/export/excel`
        : `${ADMIN_USERS_BASE}/export/pdf`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al exportar: ${res.status} - ${errorText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `usuarios_${timestamp}.${tipo === 'excel' ? 'xlsx' : 'pdf'}`;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      showNotification(`✅ Archivo ${tipo.toUpperCase()} descargado correctamente`, "success");
      
    } catch (error) {
      console.error('❌ Error completo:', error);
      showNotification(`❌ Error al exportar: ${error.message}`, "error");
    }
  };

  const filteredUsers = Array.isArray(usuarios)
    ? usuarios.filter((u) =>
        `${u.nombre || ""} ${u.apellido || ""} ${u.correo || ""} ${
          u.num_identificacion || ""
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
      {/* ✅ Pasar las props necesarias al Header */}
      {isMobile ? (
        <HeaderMovil onLogout={handleLogout} usuario={usuario} />
      ) : (
        <Header onLogout={handleLogout} usuario={usuario} />
      )}

      <div className="usuarios-container">
        <div className="usuarios-header">
          <h2>Gestión de Usuarios</h2>
          <div className="usuarios-actions">
            <div className="usuarios-search">
              <FaSearch className="usuarios-search-icon" />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button
              className="usuarios-btn create"
              onClick={handleCreate}
              title="Crear Usuario"
            >
              <i className="bx bx-user-plus"></i>
            </button>
            <button
              className="usuarios-btn excel"
              onClick={() => handleExport("excel")}
              title="Exportar a Excel"
            >
              <FaFileExcel />
            </button>
            <button
              className="usuarios-btn pdf"
              onClick={() => handleExport("pdf")}
              title="Exportar a PDF"
            >
              <FaFilePdf />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="usuarios-loading">Cargando usuarios...</p>
        ) : (
          <div className="usuarios-table-wrapper">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NOMBRE</th>
                  <th>APELLIDO</th>
                  <th>CORREO</th>
                  <th>ROL</th>
                  <th>IDENTIFICACIÓN</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={processingId === u.id ? "processing" : ""}
                    >
                      <td>{u.id}</td>
                      <td>{u.nombre}</td>
                      <td>{u.apellido}</td>
                      <td>{u.correo}</td>
                      <td>{u.rol}</td>
                      <td>
                        {u.tipo_identificacion || "-"}:{" "}
                        {u.num_identificacion || "-"}
                      </td>
                      <td>
                        <div className="estado-toggle-wrapper">
                          <button
                            className={`estado-toggle-btn ${
                              u.estado === "Activo" ? "active" : "inactive"
                            } ${processingId === u.id ? "processing" : ""}`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={processingId !== null} // Deshabilita TODOS cuando hay uno procesando
                            style={{
                              opacity: processingId !== null && processingId !== u.id ? 0.4 : 1,
                              cursor: processingId !== null ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {processingId === u.id ? (
                              <>
                                <i className="bx bx-loader-alt bx-spin"></i>
                                <span>Procesando...</span>
                              </>
                            ) : (
                              <>
                                <i
                                  className={`bx ${
                                    u.estado === "Activo"
                                      ? "bx-toggle-right"
                                      : "bx-toggle-left"
                                  }`}
                                ></i>
                                <span>
                                  {u.estado === "Activo" ? "Activo" : "Inactivo"}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="acciones-wrapper">
                          <button
                            className="accion-btn edit"
                            onClick={() => handleEdit(u)}
                            disabled={processingId === u.id}
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
                    <td colSpan="8" className="usuarios-empty">
                      {usuarios.length === 0
                        ? "No hay usuarios registrados."
                        : "No hay usuarios que coincidan con la búsqueda."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {(editingUser || creatingUser) && (
          <div className="usuarios-modal-overlay">
            <div className="usuarios-modal">
              <div className="usuarios-modal-header">
                <h3>
                  {creatingUser
                    ? "Crear Usuario"
                    : `Editar Usuario #${editingUser.id}`}
                </h3>
                <button className="usuarios-modal-close" onClick={closeModal}>
                  <FaTimes />
                </button>
              </div>

              <div className="usuarios-modal-body">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />

                <label>Apellido *</label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: e.target.value })
                  }
                />

                <label>Correo *</label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) =>
                    setFormData({ ...formData, correo: e.target.value })
                  }
                />

                {creatingUser && (
                  <>
                    <label>Contraseña *</label>
                    <input
                      type="password"
                      value={formData.clave}
                      onChange={(e) =>
                        setFormData({ ...formData, clave: e.target.value })
                      }
                      placeholder="Mínimo 8 caracteres"
                    />

                    <label>Rol</label>
                    <select
                      value={formData.rol}
                      onChange={(e) =>
                        setFormData({ ...formData, rol: e.target.value })
                      }
                    >
                      <option value="usuario">Usuario</option>
                      <option value="bibliotecario">Bibliotecario</option>
                    </select>
                  </>
                )}

                <label>Tipo de Identificación</label>
                <select
                  value={formData.tipo_identificacion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_identificacion: e.target.value,
                    })
                  }
                >
                  <option value="">Seleccione...</option>
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="TI">Tarjeta de Identidad (TI)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                </select>

                <label>Número identificación</label>
                <input
                  type="text"
                  value={formData.num_identificacion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      num_identificacion: e.target.value,
                    })
                  }
                />
              </div>

              <div className="usuarios-modal-footer">
                <button
                  className="usuarios-modal-btn save"
                  onClick={creatingUser ? handleCreateUser : handleSave}
                >
                  <FaSave /> {creatingUser ? "Crear" : "Guardar"}
                </button>
                <button
                  className="usuarios-modal-btn cancel"
                  onClick={closeModal}
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

export default Usuarios;