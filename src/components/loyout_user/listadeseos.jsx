import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import HeaderMovil from "../loyout_user/HeaderMovil";
import Footer from "../loyout_reusable/footer";
import BookCard from "./BookCard"; 
import BookModal from "./BookModal"; 
import "../../assets/css/dashboard_user.css";
import "../../assets/css/lista_deseos.css";

export default function ListaDeseos({ isMobile }) {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [listaDeseos, setListaDeseos] = useState([]);
    const [filteredLista, setFilteredLista] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState(null); 
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState("exito");

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

    const cargarListaDeseos = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch("http://127.0.0.1:8000/wishlist/list", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Error al obtener lista de deseos");
            const data = await res.json();
            
            const librosOrdenados = (data.wishlist || []).reverse(); 
            setListaDeseos(librosOrdenados);
            setFilteredLista(librosOrdenados);
        } catch (error) {
            console.error("Error al cargar lista de deseos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarListaDeseos();
    }, []);

    const handleSearch = (query) => {
        setSearchTerm(query);

        if (!query.trim()) {
            setFilteredLista(listaDeseos);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtrados = listaDeseos.filter(
            (book) =>
                book.titulo.toLowerCase().includes(lowerQuery) ||
                book.autor.toLowerCase().includes(lowerQuery)
        );
        setFilteredLista(filtrados);
    };

    // ✅ FUNCIÓN CORREGIDA - Ahora usa book.id correctamente
    const handleRemoveFromWishlist = async (bookToRemove) => {
    const bookId = bookToRemove?.id || bookToRemove?.lista_deseos_id;
    const token = localStorage.getItem("token");

    if (!bookId || !token) return;

    // ✅ OPTIMISTIC UPDATE - Actualizar UI antes de que responda el servidor
    setListaDeseos(prev => prev.filter(book => book.id !== bookId));
    setFilteredLista(prev => prev.filter(book => book.id !== bookId));
    setSelectedBook(null);

    try {
        const res = await fetch(`http://127.0.0.1:8000/wishlist/delete/${bookId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            // Si falla, revertir
            await cargarListaDeseos();
            const errorData = await res.json();
            throw new Error(errorData.detail || "Error al eliminar libro");
        }

        setTipoMensaje("exito");
        setMensaje("✅ Libro eliminado de la lista de deseos");
        setTimeout(() => setMensaje(""), 2500);
    } catch (error) {
        console.error("❌ Error al eliminar de lista:", error);
        setTipoMensaje("error");
        setMensaje(`❌ Error: ${error.message}`);
        setTimeout(() => setMensaje(""), 3000);
    }
};

    // ⚠️ Acción para invitados (aunque aquí siempre hay sesión)
    const handleGuestAction = () => {
        setTipoMensaje("advertencia");
        setMensaje("Inicia sesión para usar esta función");
        setTimeout(() => setMensaje(""), 2500);
    };

    const handleLogout = () => { 
        localStorage.removeItem("token"); 
        navigate("/"); 
    };
    
    const openBookModal = (book) => {
        console.log("📖 Abriendo modal para:", book);
        setSelectedBook(book);
    };
    
    const closeBookModal = () => setSelectedBook(null);

    return (
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
        onRedirectToLogin={handleRedirectToLogin} 
      />
    )}

            {mensaje && (
                <div className={`mensaje-flotante ${tipoMensaje}`}>
                    {mensaje}
                </div>
            )}

            <main>
                <section className="lista-deseos-hero">
                    <div className="text-center">
                        <span className="dashboard-user mi-span">*</span>
                        <h1>Mi Lista de Deseos</h1>
                        <p>Los libros que has guardado para leer más tarde</p>
                    </div>
                </section>

                <hr className="wishlist-separator" />

                <section className="lista-deseos-content wishlist-container">
                    {loading ? (
                        <div className="loading text-center">
                            <i className="bx bx-loader-alt bx-spin"></i>
                            <p>Cargando tu lista de deseos...</p>
                        </div>
                    ) : filteredLista.length === 0 ? (
                        <div className="empty-state text-center">
                            <h2>No se encontraron resultados 😟</h2>
                            {searchTerm ? (
                                <p>Prueba con otro título o autor.</p>
                            ) : (
                                <p>Tu lista de deseos está vacía.</p>
                            )}
                            {!searchTerm && (
                                <button
                                    className="cta-button"
                                    onClick={() => navigate("/catalogo")}
                                >
                                    <i className="bx bx-search"></i> Explorar Catálogo
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="wishlist-grid">
                            {filteredLista.map((book, index) => {
                                // ✅ Normalizar el key de OpenLibrary
                                const normalizedKey = book.openlibrary_key?.startsWith('/') 
                                    ? book.openlibrary_key 
                                    : `/works/${book.openlibrary_key}`;

                                return (
                                    <BookCard
                                        key={`wishlist-${book.id}-${index}`}
                                        book={{ 
                                            ...book,
                                            title: book.titulo,
                                            author_name: [book.autor], 
                                            cover_i: book.cover_id,
                                            key: normalizedKey,
                                            id: book.id // ✅ Asegurar que book.id existe
                                        }}
                                        usuario={usuario}
                                        isBookSaved={true}
                                        onRemoveFromWishlist={handleRemoveFromWishlist}
                                        onAddToWishlist={() => {}}
                                        handleGuestAction={handleGuestAction}
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            <hr className="wishlist-separator" />
            <Footer />

            {selectedBook && (
                <BookModal
                    book={{ 
                        ...selectedBook, 
                        title: selectedBook.titulo,
                        author_name: [selectedBook.autor], 
                        cover_i: selectedBook.cover_id,
                        key: selectedBook.openlibrary_key?.startsWith('/') 
                            ? selectedBook.openlibrary_key 
                            : `/works/${selectedBook.openlibrary_key}`,
                        id: selectedBook.id // ✅ ID correcto
                    }}
                    onClose={closeBookModal}
                    usuario={usuario} // ✅ Pasar usuario
                    isBookSaved={true}
                    onRemoveFromWishlist={handleRemoveFromWishlist}
                    onAddToWishlist={() => {}}
                    handleGuestAction={handleGuestAction} // ✅ Pasar handleGuestAction
                />
            )}
        </div>
    );
}