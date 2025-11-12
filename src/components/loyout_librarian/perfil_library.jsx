import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import HeaderMovil from "./HeaderMovil";
import Footer from "../loyout_reusable/footer";
import "../../assets/css/perfil.css";

export default function Perfil({ isMobile }) {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        tipo_identificacion: "",
        num_identificacion: "",
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        }
    }, [navigate]);

    const cargarDatosUsuario = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoading(true);

        try {
            const res = await fetch("http://10.17.0.26:8000/users/me", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                localStorage.removeItem("token");
                navigate("/");
                return;
            }

            const data = await res.json();
            setUsuario(data);
            setFormData({
                nombre: data.nombre || "",
                apellido: data.apellido || "",
                email: data.email || data.correo || "",
                tipo_identificacion: data.tipo_identificacion || "",
                num_identificacion: data.num_identificacion || "",
            });
        } catch (error) {
            console.error("Error al cargar datos del usuario:", error);
            localStorage.removeItem("token");
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatosUsuario();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        
        setUpdating(true);
        
        try {
            console.log("📤 Enviando datos:", formData);
            
            const res = await fetch("http://10.17.0.26:8000/users/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            console.log("📥 Response status:", res.status);
            
            if (!res.ok) {
                const errorData = await res.json();
                console.error("❌ Error del servidor:", errorData);
                throw new Error(errorData.detail || "Error al actualizar perfil");
            }
            
            const data = await res.json();
            console.log("✅ Datos recibidos del servidor:", data);
            
            setUsuario(data);
            
            setFormData({
                nombre: data.nombre || "",
                apellido: data.apellido || "",
                email: data.email || data.correo || "",
                tipo_identificacion: data.tipo_identificacion || "",
                num_identificacion: data.num_identificacion || "",
            });
            
            setEditMode(false);
            alert("✅ Perfil actualizado correctamente");
            
        } catch (error) {
            console.error("💥 Error al actualizar perfil:", error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const handleDesactivar = async () => {
        if (!window.confirm("¿Estás seguro de que deseas desactivar tu cuenta? Esta acción marcará tu cuenta como inactiva.")) return;

        const token = localStorage.getItem("token");
        
        try {
            console.log("🔄 Iniciando desactivación de cuenta...");
            
            const res = await fetch("http://10.17.0.26:8000/users/me", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log("📥 Response status:", res.status);
            
            if (!res.ok) {
                const errorData = await res.json();
                console.error("❌ Error del servidor:", errorData);
                throw new Error(errorData.detail || "Error al desactivar cuenta");
            }
            
            const data = await res.json();
            console.log("✅ Cuenta desactivada:", data);
            
            localStorage.removeItem("token");
            alert("Cuenta desactivada correctamente. Serás redirigido al inicio.");
            
            setTimeout(() => {
                navigate("/", { replace: true });
            }, 100);
            
        } catch (error) {
            console.error("💥 Error al desactivar cuenta:", error);
            alert(`❌ Error al desactivar la cuenta: ${error.message}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    if (loading) {
        return (
            <div className="dashboard-user">
                {isMobile ? (
                    <HeaderMovil
                        onLogout={handleLogout}
                        usuario={usuario}
                    />
                ) : (
                    <Header  
                        onLogout={handleLogout} 
                        usuario={usuario}
                    />
                )} 
                <main>
                    <div className="loading">
                        <i className="bx bx-loader-alt bx-spin"></i>
                        <p>Cargando perfil...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="dashboard-user">
            {isMobile ? (
                <HeaderMovil
                    onLogout={handleLogout}
                    usuario={usuario}
                />
            ) : (
                <Header
                    onLogout={handleLogout}
                    usuario={usuario}
                />
            )}

            <main>
                <section className="perfil-hero-aurora">
                    <h1>Mi Perfil</h1>
                    <p>Gestiona tu información personal</p>
                </section>

                <div className="perfil-content">
                    <div className="perfil-card">
                        <div className="perfil-header-info">
                            <div className="avatar-circle">
                                <i className="bx bx-user-circle"></i>
                            </div>
                            <div className="user-info">
                                <h2>{usuario?.nombre} {usuario?.apellido}</h2>
                                <span className="user-role">
                                    <i className="bx bx-badge-check"></i> 
                                    {usuario?.rol === "usuario" ? "Usuario" : "Bibliotecario"}
                                </span>
                            </div>
                        </div>

                        <hr className="divider" />

                        {!editMode ? (
                            <>
                                <div className="info-list">
                                    <div className="info-item">
                                        <i className="bx bx-user"></i>
                                        <div>
                                            <label>Nombre completo</label>
                                            <p>{usuario?.nombre} {usuario?.apellido}</p>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <i className="bx bx-envelope"></i>
                                        <div>
                                            <label>Correo electrónico</label>
                                            <p>{usuario?.email || usuario?.correo}</p>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <i className="bx bx-id-card"></i>
                                        <div>
                                            <label>Tipo de identificación</label>
                                            <p>{usuario?.tipo_identificacion || "No registrado"}</p>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <i className="bx bx-hash"></i>
                                        <div>
                                            <label>Número de identificación</label>
                                            <p>{usuario?.num_identificacion || "No registrado"}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <hr className="divider" />
                                <div className="action-buttons-bottom">
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => setEditMode(true)}
                                        disabled={editMode}
                                    >
                                        <i className="bx bx-edit"></i> Editar Perfil
                                    </button>
                                    <button className="btn-danger" onClick={handleDesactivar}>
                                        <i className="bx bx-user-x"></i> Eliminar Cuenta
                                    </button>
                                </div>
                            </>
                        ) : (
                            <form className="edit-form-modern" onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            <i className="bx bx-user"></i> Nombres
                                        </label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            required
                                            disabled={updating}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i className="bx bx-user"></i> Apellidos
                                        </label>
                                        <input
                                            type="text"
                                            name="apellido"
                                            value={formData.apellido}
                                            onChange={handleInputChange}
                                            required
                                            disabled={updating}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>
                                        <i className="bx bx-envelope"></i> Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        disabled={updating}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            <i className="bx bx-id-card"></i> Tipo de Identificación
                                        </label>
                                        <select
                                            name="tipo_identificacion"
                                            value={formData.tipo_identificacion}
                                            onChange={handleInputChange}
                                            disabled={updating}
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="CC">Cédula de Ciudadanía</option>
                                            <option value="TI">Tarjeta de Identidad</option>
                                            <option value="CE">Cédula de Extranjería</option>
                                            <option value="PA">Pasaporte</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i className="bx bx-hash"></i> Número de Identificación
                                        </label>
                                        <input
                                            type="text"
                                            name="num_identificacion"
                                            value={formData.num_identificacion}
                                            onChange={handleInputChange}
                                            disabled={updating}
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-save" disabled={updating}>
                                        {updating ? (
                                            <>
                                                <i className="bx bx-loader-alt bx-spin"></i> Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-check"></i> Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setEditMode(false)}
                                        disabled={updating}
                                    >
                                        <i className="bx bx-x"></i> Cancelar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}