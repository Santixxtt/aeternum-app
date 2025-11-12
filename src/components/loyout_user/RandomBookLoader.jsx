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
        const res = await fetch("http://10.17.0.26:8000/wishlist/add", {
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

        // ✅ CRÍTICO: Actualizar el libro en la lista con el libro_id recibido
        if (data.libro_id) {
            setLibros(prevLibros => 
                prevLibros.map(lib => 
                    lib.key === book.key 
                        ? { ...lib, libro_id: data.libro_id, isBookSaved: true }
                        : lib
                )
            );
            console.log("✅ Libro actualizado con ID:", data.libro_id);
        }

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
