import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import HeaderMovil from "./HeaderMovil";
import Footer from "../loyout_reusable/footer";
import AeternumBienvenida from "../loyout_reusable/AeternumBienvenida";
import SearchResults from "./SearchResults";
import RandomBookLoader from "./RandomBookLoader";
import PhysicalLoanModal from "./PhysicalLoanModal";
import defaultImage from "../../assets/img/book-placeholder.png";
import "../../assets/css/dashboard_user.css";

export default function DashboardUser({ isMobile }) {
  const [usuario, setUsuario] = useState(null);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Estados del carrusel
  const [carouselBooks, setCarouselBooks] = useState([]);
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [bookDescriptions, setBookDescriptions] = useState({});
  const [showPhysicalLoanModal, setShowPhysicalLoanModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch("http://10.17.0.28:8000/users/me", {
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

  // Cargar libros para el carrusel
  useEffect(() => {
    const fetchCarouselBooks = async () => {
      setCarouselLoading(true);
      try {
        const queries = ["fantasy", "science", "love", "history", "mystery", "adventure"];
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${randomQuery}&limit=10`
        );
        const data = await res.json();
        const books = data.docs?.filter(book => book.cover_i) || [];
        setCarouselBooks(books);
        
        // Cargar descripciones
        books.forEach(book => {
          fetchBookDescription(book.key);
        });
      } catch (error) {
        console.error("Error al cargar libros del carrusel:", error);
      } finally {
        setCarouselLoading(false);
      }
    };

    if (query.length === 0) {
      fetchCarouselBooks();
    }
  }, [query]);

  // Fetch descripción de un libro
  const fetchBookDescription = async (bookKey) => {
    try {
      const url = `https://openlibrary.org${bookKey}.json`;
      const res = await fetch(url);
      const data = await res.json();
      
      let description = "No hay resumen disponible.";
      if (data.description) {
        description = typeof data.description === "string"
          ? data.description
          : data.description.value || description;
      } else if (data.excerpt?.value) {
        description = data.excerpt.value;
      }

      setBookDescriptions(prev => ({
        ...prev,
        [bookKey]: description
      }));
    } catch (err) {
      console.error("Error al cargar descripción:", err);
    }
  };

  // Auto-avanzar el carrusel
  useEffect(() => {
    if (carouselBooks.length === 0 || query.length > 0) return;

    const interval = setInterval(() => {
      if (showWelcome) {
        setShowWelcome(false);
      } else {
        setCurrentBookIndex((prev) => (prev + 1) % carouselBooks.length);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [carouselBooks.length, showWelcome, query]);

  const searchBooks = async (q) => {
    if (!q || q.length < 3) {
      setResultados([]);
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(
        `http://10.17.0.28:8000/search/books?q=${encodeURIComponent(q)}&limit=20`
      );
      
      if (!res.ok) {
        throw new Error(`Error al buscar: ${res.status}`);
      }
      
      const data = await res.json();
      
      console.log(`📚 Búsqueda: "${q}" - ${data.total_local} locales + ${data.total_openlibrary} OpenLibrary`);
      
      setResultados(data.docs || []);
      
    } catch (error) {
      console.error("Error al buscar libros:", error);
      
      try {
        console.log("⚠️ Usando fallback de OpenLibrary...");
        const fallbackRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`
        );
        const fallbackData = await fallbackRes.json();
        
        const docs = (fallbackData.docs || []).map(doc => ({
          ...doc,
          es_local: false
        }));
        
        setResultados(docs);
      } catch (fallbackError) {
        console.error("Error en fallback:", fallbackError);
        setResultados([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (q) => {
    setQuery(q);
    searchBooks(q);
    setShowWelcome(true);
  };

  const handleAddToWishlist = useCallback(async (book) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para agregar libros a tu lista de deseos.");
      return;
    }

    try {
      let genero = "No Clasificado";
      let editorial = "Desconocida";
      
      try {
        const workUrl = `https://openlibrary.org${book.key}.json`;
        const workRes = await fetch(workUrl);
        const workData = await workRes.json();
        
        if (workData.subjects && workData.subjects.length > 0) {
          genero = workData.subjects[0];
        }
        
        const editionsUrl = `https://openlibrary.org${book.key}/editions.json`;
        const editionsRes = await fetch(editionsUrl);
        const editionsData = await editionsRes.json();
        
        if (editionsData.entries) {
          for (const edition of editionsData.entries) {
            if (edition.publishers && edition.publishers.length > 0) {
              editorial = edition.publishers[0];
              break;
            }
          }
        }
      } catch (apiError) {
        console.error("Error al obtener detalles:", apiError);
      }

      const body = {
        openlibrary_key: book.key,
        titulo: book.title,
        autor: book.author_name?.[0] || "Desconocido",
        genero: genero,
        editorial: editorial,
        descripcion: "",
        cover_id: book.cover_i || null,
        fecha_publicacion: book.first_publish_year?.toString() || null
      };

      const res = await fetch("http://10.17.0.28:8000/wishlist/add", {
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

      alert("✅ Libro agregado a tu lista de deseos.");
    } catch (error) {
      console.error("Error al agregar a la lista de deseos:", error);
      alert("No se pudo agregar el libro. Intenta más tarde.");
    }
  }, []);

  const handleBorrow = useCallback((book) => {
    console.log("Pedir prestado:", book);
  }, []);

  const handleGuestAction = useCallback(() => {
    alert("🔒 Debes iniciar sesión para usar esta función");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handlePrevBook = () => {
    if (showWelcome) {
      setCurrentBookIndex(carouselBooks.length - 1);
      setShowWelcome(false);
    } else {
      setCurrentBookIndex((prev) => (prev - 1 + carouselBooks.length) % carouselBooks.length);
    }
  };

  const handleNextBook = () => {
    if (showWelcome) {
      setShowWelcome(false);
    } else {
      setCurrentBookIndex((prev) => (prev + 1) % carouselBooks.length);
    }
  };

  const handlePhysicalBorrow = (book) => {
    if (!usuario) {
      handleGuestAction();
      return;
    }
    setSelectedBook(book);
    setShowPhysicalLoanModal(true);
  };

  const truncateText = (text, maxLength = 400) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const currentBook = carouselBooks[currentBookIndex];
  const currentDescription = currentBook ? bookDescriptions[currentBook.key] : "";

  // 🔥 CORRECCIÓN: Envolver TODO con AeternumBienvenida
  return (
    <AeternumBienvenida>
      <div className="dashboard-user">
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
            <section className="carousel-container">
              <button className="carousel-nav carousel-nav-left" onClick={handlePrevBook}>
                <i className='bx bx-chevron-left'></i>
              </button>

              <div className="carousel-content">
                {showWelcome ? (
                  <div className="carousel-welcome">
                    <h1>Bienvenid@ {usuario.nombre} {usuario.apellido}</h1>
                    <p>
                      ¡Qué bueno tenerte aquí! ¿Estás listo para leer? Es hora de explorar nuevos
                      libros y dejarte llevar por historias fascinantes. No es solo leer, es vivir mil vidas
                      desde la comodidad de tus propios pensamientos. ¡Empieza ahora tu viaje hacia lo extraordinario!
                    </p>
                    <a href="/loyout_user/lista_deseos" className="cta-button">
                      Mira tu Lista de Deseos
                    </a>
                  </div>
                ) : carouselLoading ? (
                  <div className="carousel-loading">
                    <div className="loader"></div>
                    <p>Cargando recomendaciones...</p>
                  </div>
                ) : currentBook ? (
                  <div className="carousel-book">
                    <div className="carousel-book-image">
                      <img
                        src={currentBook.cover_i 
                          ? `https://covers.openlibrary.org/b/id/${currentBook.cover_i}-L.jpg`
                          : defaultImage}
                        alt={currentBook.title}
                        onError={(e) => {
                          if (e.target.src !== defaultImage) {
                            e.target.src = defaultImage;
                          }
                        }}
                      />
                    </div>
                    <div className="carousel-book-info">
                      <h2>{currentBook.title}</h2>
                      <p className="carousel-author">
                        <strong>Autor:</strong> {currentBook.author_name?.[0] || "Desconocido"}
                      </p>
                      {currentBook.first_publish_year && (
                        <p className="carousel-year">
                          <strong>Año:</strong> {currentBook.first_publish_year}
                        </p>
                      )}
                      <div className="carousel-description">
                        <h3>Resumen</h3>
                        <p>{currentDescription ? truncateText(currentDescription) : "Cargando resumen..."}</p>
                      </div>
                      <div className="carousel-actions">
                        <button 
                          className="btn-wishlist"
                          onClick={() => handleAddToWishlist(currentBook)}
                        >
                          <i className='bxs-star'></i> Lista de Deseos
                        </button>
                        <button 
                          className="btn-physical-loan"
                          onClick={() => handlePhysicalBorrow(currentBook)}
                        >
                          <i className='bxs-book'></i> Préstamo Físico
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <button className="carousel-nav carousel-nav-right" onClick={handleNextBook}>
                <i className='bx bx-chevron-right'></i>
              </button>

              <div className="carousel-indicators">
                <span 
                  className={showWelcome ? "indicator active" : "indicator"}
                  onClick={() => setShowWelcome(true)}
                ></span>
                {carouselBooks.map((_, index) => (
                  <span
                    key={index}
                    className={!showWelcome && index === currentBookIndex ? "indicator active" : "indicator"}
                    onClick={() => {
                      setShowWelcome(false);
                      setCurrentBookIndex(index);
                    }}
                  ></span>
                ))}
              </div>
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

        {showPhysicalLoanModal && selectedBook && (
          <PhysicalLoanModal
            book={selectedBook}
            usuario={usuario}
            onClose={() => {
              setShowPhysicalLoanModal(false);
              setSelectedBook(null);
            }}
          />
        )}
      </div>
    </AeternumBienvenida>
  );
}