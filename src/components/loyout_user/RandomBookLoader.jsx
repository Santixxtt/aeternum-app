import { useState, useEffect, useCallback} from 'react';
import Recomendados from './Recomendados'; 
import LoadingDots from '../loyout_reusable/LoadingDots'; 

export default function RandomBookLoader({ onAddToWishlist, onBorrow, usuario, handleGuestAction }) {
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ✅ Estados para el mensaje flotante
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("exito");

  useEffect(() => {
    const fetchRecomendaciones = async () => {
      setLoading(true);
      setError(false);
      try {
        const queries = ["fantasy", "science", "love", "history", "mystery"];
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        const res = await fetch(`https://openlibrary.org/search.json?q=${randomQuery}&limit=12`);

        if (!res.ok) {
          throw new Error('Error de red o servidor al cargar libros.');
        }

        const data = await res.json();
        setLibros(data.docs || []);
        
      } catch (e) {
        console.error("Error al cargar recomendaciones:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRecomendaciones();
  }, []); 

  // ✅ Función local que muestra mensaje de éxito/error
  // Función para agregar a wishlist
// ✅ REEMPLAZA la función handleAddToWishlist en catalogo.jsx con esta:

const handleAddToWishlist = useCallback(async (book) => {
    console.log("📤 ENVIANDO libro a wishlist:", book);
    
    const token = localStorage.getItem("token");
    if (!token) {
        handleGuestAction();
        return;
    }

    try {
        // ✅ Construir el objeto con TODOS los campos necesarios
        const libroData = {
            openlibrary_key: book.key || book.openlibrary_key,
            titulo: book.title || book.titulo,
            autor: book.author_name?.[0] || book.autor || "Desconocido",
            genero: book.subject?.[0] || book.genero || "No Clasificado",
            editorial: book.publisher?.[0] || book.editorial || "Desconocida",
            descripcion: "", // Opcional, puedes dejarlo vacío o eliminarlo si no lo usas
            cover_id: book.cover_i || book.cover_id || null,
            fecha_publicacion: book.first_publish_year?.toString() || book.fecha_publicacion || null
        };

        console.log("📦 Datos formateados para enviar:", libroData);

        const res = await fetch("http://127.0.0.1:8000/wishlist/add", {
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
        console.log("✅ Libro agregado exitosamente:", data);

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

  return (
    <section className="dashboard-user">
      {/* ✅ Mensaje flotante animado */}
      {mensaje && (
        <div className={`mensaje-flotante ${tipoMensaje}`}>
          {mensaje}
        </div>
      )}

      <div className="text-center">
        <span className="dashboard-user mi-span">*</span>
        <h2 className="p-32">Recomendaciones para ti</h2>
      </div>
      
      {loading && (
        <div className="text-center py-10 loading-area">
          <LoadingDots />
        </div>
      )}

      {error && (
        <div className="text-center py-10 text-red-600">
          <p>Lo sentimos, no pudimos cargar las recomendaciones.</p>
          <p>Verifica tu conexión a internet o inténtalo más tarde.</p>
        </div>
      )}

      {!loading && !error && libros.length === 0 && (
        <div className="text-center py-10">No hay recomendaciones disponibles en este momento.</div>
      )}

      {/* Solo renderiza la lista si no está cargando, no hay error, y hay libros */}
      {!loading && !error && libros.length > 0 && (
        <Recomendados 
          libros={libros} 
          usuario={usuario}              
          onAddToWishlist={handleAddToWishlist} 
          onBorrow={onBorrow}
          handleGuestAction={handleGuestAction}  
        />
      )}
    </section>
  );
}
