import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../loyout_user/header";
import HeaderMovil from "../loyout_user/HeaderMovil"; 
import Footer from "../loyout_reusable/footer";
import SearchResults from "../loyout_user/SearchResults";
import "../../assets/css/catalogo.css";


export default function Catalogo({ isMobile }) {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todos");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("exito");

  // ✅ Obtener información del usuario si hay token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://10.17.0.32:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject("Token inválido")))
        .then((data) => setUsuario(data))
        .catch(() => localStorage.removeItem("token"));
    }
  }, []);

  // ✅ Cargar catálogo principal
  const cargarCatalogo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=subject:fiction&limit=48`
      );
      const data = await res.json();
      setResultados(data.docs || []);
    } catch (error) {
      console.error("Error al cargar el catálogo:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔄 Cargar catálogo al montar el componente
  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  // 🔍 Buscar libros
  const searchBooks = useCallback(
    async (q) => {
      if (!q || q.length < 3) {
        cargarCatalogo();
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=50`
        );
        const data = await res.json();
        setResultados(data.docs || []);
      } catch (error) {
        console.error("Error al buscar libros:", error);
      } finally {
        setLoading(false);
      }
    },
    [cargarCatalogo]
  );

  // 🧩 Filtrar por categoría
  const filtrarPorCategoria = useCallback(async (categoria) => {
    setCategoriaSeleccionada(categoria);
    setLoading(true);
    try {
      const url =
        categoria === "todos"
          ? `https://openlibrary.org/search.json?q=subject:fiction&limit=50`
          : `https://openlibrary.org/search.json?q=subject:${categoria}&limit=50`;
      const res = await fetch(url);
      const data = await res.json();
      setResultados(data.docs || []);
    } catch (error) {
      console.error("Error al filtrar libros:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ⚠️ Acción para invitados (sin sesión)
  const handleGuestAction = useCallback(() => {
    setTipoMensaje("advertencia");
    setMensaje(" Inicia sesión para usar esta función.");
    setTimeout(() => setMensaje(""), 2500);
  }, []);

  // 💜 Agregar a lista de deseos - VERSIÓN CORREGIDA CON LLAMADAS A API
  const handleAddToWishlist = useCallback(async (book) => {
    console.log("📤 INICIANDO agregar a wishlist:", book.title);
    
    const token = localStorage.getItem("token");
    if (!token) {
        handleGuestAction();
        return;
    }

    try {
        // ✅ PASO 1: Obtener detalles adicionales del libro desde OpenLibrary
        let genero = "No Clasificado";
        let editorial = "Desconocida";
        
        console.log("🔍 Buscando género y editorial en OpenLibrary...");
        
        try {
            // Obtener información completa del work
            const workUrl = `https://openlibrary.org${book.key}.json`;
            console.log("📡 Llamando a:", workUrl);
            const workRes = await fetch(workUrl);
            const workData = await workRes.json();
            
            console.log("📚 Datos del work recibidos");
            
            // Extraer género de subjects
            if (workData.subjects && workData.subjects.length > 0) {
                genero = workData.subjects[0];
                console.log("✅ Género encontrado:", genero);
            } else {
                console.log("⚠️ No hay subjects en el work");
            }
            
            // Obtener editorial de las ediciones
            const editionsUrl = `https://openlibrary.org${book.key}/editions.json`;
            console.log("📡 Llamando a:", editionsUrl);
            const editionsRes = await fetch(editionsUrl);
            const editionsData = await editionsRes.json();
            
            console.log("📚 Ediciones encontradas:", editionsData.entries?.length || 0);
            
            // Buscar la primera editorial disponible
            if (editionsData.entries) {
                for (const edition of editionsData.entries) {
                    if (edition.publishers && edition.publishers.length > 0) {
                        editorial = edition.publishers[0];
                        console.log("✅ Editorial encontrada:", editorial);
                        break;
                    }
                }
            }
            
            if (editorial === "Desconocida") {
                console.log("⚠️ No se encontró editorial en ninguna edición");
            }
            
        } catch (apiError) {
            console.error("❌ Error al obtener detalles de OpenLibrary:", apiError);
        }

        // ✅ PASO 2: Construir el objeto con TODOS los campos
        const libroData = {
            openlibrary_key: book.key || book.openlibrary_key,
            titulo: book.title || book.titulo,
            autor: book.author_name?.[0] || book.autor || "Desconocido",
            genero: genero,
            editorial: editorial,
            descripcion: "", 
            cover_id: book.cover_i || book.cover_id || null,
            fecha_publicacion: book.first_publish_year?.toString() || book.fecha_publicacion || null
        };

        console.log("📦 DATOS FINALES para enviar:", libroData);

        // ✅ PASO 3: Enviar al backend
        console.log("📡 Enviando al backend...");
        const res = await fetch("http://10.17.0.32:8000/wishlist/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(libroData),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || "Error al agregar libro");
        }

        const data = await res.json();
        console.log("✅ Respuesta del backend:", data);

        setTipoMensaje("exito");
        setMensaje("✅ Libro agregado a la lista de deseos");
        setTimeout(() => setMensaje(""), 2500);

    } catch (error) {
        console.error("❌ Error al agregar a wishlist:", error);
        setTipoMensaje("error");
        setMensaje(`❌ ${error.message}`);
        setTimeout(() => setMensaje(""), 3000);
    }
}, [handleGuestAction]);

  // 📚 Pedir prestado (digital o físico)
  const handleBorrow = useCallback(
    (book, tipo = "digital") => {
      if (!usuario) {
        handleGuestAction();
        return;
      }

      if (tipo === "digital") {
        const openLibraryUrl = `https://openlibrary.org${book.key}`;
        window.open(openLibraryUrl, "_blank");
      } else {
        setTipoMensaje("exito");
        setMensaje(`📚 Has solicitado el préstamo físico de "${book.title}"`);
        setTimeout(() => setMensaje(""), 2500);
      }
    },
    [usuario, handleGuestAction]
  );

  // 📥 Descargar libro digital
  const handleDownload = useCallback(
    (book) => {
      if (!usuario) {
        handleGuestAction();
        return;
      }

      const downloadUrl = `https://openlibrary.org${book.key}`;
      window.open(downloadUrl, "_blank");
    },
    [usuario, handleGuestAction]
  );

  // 🚪 Cerrar sesión
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/");
  }, [navigate]);

  const handleRedirectToLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  // 🔎 Buscar desde el header
  const handleSearch = useCallback(
    (q) => {
      searchBooks(q);
    },
    [searchBooks]
  );

  // 🧱 Render principal
  return (
    <div className="dashboard-user">
      {/* 🔸 Mostrar HeaderMovil en móvil, Header en desktop */}
    {isMobile ? (
      <HeaderMovil
        onSearch={handleSearch}
        onLogout={handleLogout}
        usuario={usuario}
      />
    ) : (
      <Header 
        onSearch={handleSearch} 
        onLogout={handleLogout} 
        usuario={usuario} 
        onRedirectToLogin={handleRedirectToLogin} 
      />
    )}

      <main>
        <section className="text-center">
          <h1 className="p-3">Catálogo de Libros</h1>
          <p>Explora nuestra colección completa de libros</p>
        </section>

        {!usuario && (
          <p className="text-center">
             Inicia sesión para agregar libros a tu lista de deseos, comentar, calificar y mucho más.
          </p>
        )}

        {mensaje && (
          <div className={`mensaje-flotante ${tipoMensaje}`}>{mensaje}</div>
        )}

        <div className="catalogo-container">
          <section className="filtros">
            <h2>Filtrar por categoría</h2>
            <div className="categoria-buttons">
              <button
                className={categoriaSeleccionada === "todos" ? "active" : ""}
                onClick={() => filtrarPorCategoria("todos")}
              >
                Todos
              </button>
              <button
                className={categoriaSeleccionada === "fiction" ? "active" : ""}
                onClick={() => filtrarPorCategoria("fiction")}
              >
                Ficción
              </button>
              <button
                className={categoriaSeleccionada === "science" ? "active" : ""}
                onClick={() => filtrarPorCategoria("science")}
              >
                Ciencia
              </button>
              <button
                className={categoriaSeleccionada === "history" ? "active" : ""}
                onClick={() => filtrarPorCategoria("history")}
              >
                Historia
              </button>
              <button
                className={categoriaSeleccionada === "fantasy" ? "active" : ""}
                onClick={() => filtrarPorCategoria("fantasy")}
              >
                Fantasía
              </button>
              <button
                className={categoriaSeleccionada === "mystery" ? "active" : ""}
                onClick={() => filtrarPorCategoria("mystery")}
              >
                Misterio
              </button>
            </div>
          </section>

          <hr />

          <div className="catalogo-book-grid">
            <SearchResults
              libros={resultados}
              loading={loading}
              usuario={usuario}
              onAddToWishlist={handleAddToWishlist}
              onBorrow={handleBorrow}
              onDownload={handleDownload}
              handleGuestAction={handleGuestAction}
            />
          </div>
        </div>
      </main>

      <hr />
      <Footer />
    </div>
  );
}