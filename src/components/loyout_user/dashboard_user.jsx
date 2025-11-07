import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./header";
import HeaderMovil from "./HeaderMovil"; // ✅ Importar HeaderMovil
import Footer from "../loyout_reusable/footer";
import SearchResults from "./SearchResults";
import RandomBookLoader from "./RandomBookLoader";
import "../../assets/css/dashboard_user.css";

export default function DashboardUser({ isMobile }) {
  const [usuario, setUsuario] = useState(null);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.warn("⚠️ Token inválido o expirado, redirigiendo...");
          localStorage.removeItem("token");
          navigate("/");
          return;
        }

        const data = await res.json();
        setUsuario(data);
      } catch (error) {
        console.error("Error al obtener usuario:", error);
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    fetchUserData();
  }, [navigate]);

  // 🔍 Buscar libros
  const searchBooks = async (q) => {
    if (!q || q.length < 3) {
      setResultados([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`
      );
      const data = await res.json();
      setResultados(data.docs || []);
    } catch (error) {
      console.error("Error al buscar libros:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Manejar búsqueda desde Header
  const handleSearch = (q) => {
    setQuery(q);
    searchBooks(q);
  };

  // 💜 Agregar a lista de deseos
  const handleAddToWishlist = useCallback(async (book) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para agregar libros a tu lista de deseos.");
      return;
    }

    const body = {
      titulo: book.title,
      autor: book.author_name?.[0] || "Desconocido",
      cover_id: book.cover_i || null,
      openlibrary_key: book.key,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`❌ ${err.detail || "Error al agregar libro a la lista de deseos."}`);
        return;
      }

      const data = await res.json();
      console.log("✅ Libro agregado:", data);
      alert("✅ Libro agregado a tu lista de deseos.");
    } catch (error) {
      console.error("Error al agregar a la lista de deseos:", error);
      alert("No se pudo agregar el libro a la lista de deseos. Intenta más tarde.");
    }
  }, []);

  // 📚 Pedir prestado
  const handleBorrow = useCallback((book) => {
    console.log("Pedir prestado:", book);
    // TODO: Implementar lógica de préstamo
  }, []);

  const handleGuestAction = useCallback(() => {
    alert("🔒 Debes iniciar sesión para usar esta función");
  }, []);

  // 🚪 Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-user">
      {/* 🔸 Header: Desktop o Móvil según dispositivo */}
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
        />
      )}

      <main>
        {usuario && query.length === 0 && (
          <section className="dashboard-user dashboard-hero">
            <h1>
              Bienvenid@ {usuario.nombre} {usuario.apellido}
            </h1>
            <p>
              ¡Qué bueno tenerte aquí! ¿Estás listo para leer? Es hora de explorar nuevos
              libros y dejarte llevar por historias fascinantes. No es solo leer, es vivir mil vidas
              desde la comodidad de tus propios pensamientos. ¡Empieza ahora tu viaje hacia lo extraordinario!
            </p>
            <a href="/loyout_user/lista_deseos" className="cta-button" data-aos="zoom-in">
              Mira tu Lista de Deseos
            </a>
          </section>
        )}

        <hr />

        {query.length >= 3 ? (
          <SearchResults
            libros={resultados}
            loading={loading}
            usuario={usuario}  
            onAddToWishlist={handleAddToWishlist}
            onBorrow={handleBorrow}
            handleGuestAction={handleGuestAction}  
          />
        ) : (
          <RandomBookLoader
            usuario={usuario}
            onAddToWishlist={handleAddToWishlist}
            onBorrow={handleBorrow}
            handleGuestAction={handleGuestAction}
          />
        )}
      </main>
      
      <hr />
      <Footer />
    </div>
  );
}