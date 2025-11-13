import { useState, useEffect, useCallback, useRef } from 'react';
import Recomendados from './Recomendados'; 
import LoadingDots from '../loyout_reusable/LoadingDots'; 

export default function RandomBookLoader({ onAddToWishlist, onBorrow, usuario, handleGuestAction }) {
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ✅ Estados para el mensaje flotante
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("exito");

  // ✅ Usar useRef para mantener el offset actualizado
  const offsetRef = useRef(0);
  const LIBROS_POR_PAGINA = 12;

  // ✅ Función para cargar libros (reutilizable) - SIN dependencias problemáticas
  const fetchRecomendaciones = useCallback(async (isLoadingMore = false) => {
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    setError(false);
    
    try {
      const queries = ["fantasy", "science", "love", "history", "mystery", "adventure", "thriller"];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      // ✅ Usar el ref para el offset actual
      const currentOffset = isLoadingMore ? offsetRef.current : 0;
      
      console.log(`📚 Cargando libros: query="${randomQuery}", offset=${currentOffset}, limit=${LIBROS_POR_PAGINA}`);
      
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${randomQuery}&limit=${LIBROS_POR_PAGINA}&offset=${currentOffset}`
      );

      if (!res.ok) {
        throw new Error(`Error de red: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const nuevosLibros = data.docs || [];
      
      console.log(`✅ Libros recibidos: ${nuevosLibros.length}`);
      
      if (isLoadingMore) {
        // ✅ Agregar libros nuevos a la lista existente
        setLibros(prev => [...prev, ...nuevosLibros]);
        offsetRef.current += LIBROS_POR_PAGINA;
      } else {
        // ✅ Primera carga: reemplazar libros
        setLibros(nuevosLibros);
        offsetRef.current = LIBROS_POR_PAGINA;
      }
      
      // ✅ Verificar si hay más libros disponibles
      setHasMore(nuevosLibros.length === LIBROS_POR_PAGINA);
      
    } catch (e) {
      console.error("❌ Error al cargar recomendaciones:", e);
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []); // ✅ Sin dependencias - usa refs internos

  // ✅ Carga inicial
  useEffect(() => {
    fetchRecomendaciones(false);
  }, [fetchRecomendaciones]); 

  // ✅ Handler para el botón "Cargar Más"
  const handleLoadMore = () => {
    console.log("🔄 Usuario solicitó cargar más libros");
    fetchRecomendaciones(true);
  };

  const handleAddToWishlist = useCallback(async (book) => {
    console.log("📤 INICIANDO agregar a wishlist:", book.title);
    
    const token = localStorage.getItem("token");
    if (!token) {
        handleGuestAction();
        return;
    }

    try {
        let genero = "No Clasificado";
        let editorial = "Desconocida";
        
        console.log("🔍 Buscando género y editorial en OpenLibrary...");
        
        try {
            const workUrl = `https://openlibrary.org${book.key}.json`;
            console.log("📡 Llamando a:", workUrl);
            const workRes = await fetch(workUrl);
            const workData = await workRes.json();
            
            console.log("📚 Datos del work recibidos");
            
            if (workData.subjects && workData.subjects.length > 0) {
                genero = workData.subjects[0];
                console.log("✅ Género encontrado:", genero);
            } else {
                console.log("⚠️ No hay subjects en el work");
            }
            
            const editionsUrl = `https://openlibrary.org${book.key}/editions.json`;
            console.log("📡 Llamando a:", editionsUrl);
            const editionsRes = await fetch(editionsUrl);
            const editionsData = await editionsRes.json();
            
            console.log("📚 Ediciones encontradas:", editionsData.entries?.length || 0);
            
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

      {!loading && !error && libros.length > 0 && (
        <>
          <Recomendados 
            libros={libros} 
            usuario={usuario}              
            onAddToWishlist={handleAddToWishlist} 
            onBorrow={onBorrow}
            handleGuestAction={handleGuestAction}  
          />
          
          {/* ✅ Botón "Cargar Más" */}
          {hasMore && (
            <div className="text-center" style={{ margin: '40px 0' }}>
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="cta-button load-more-btn"
                style={{
                  padding: '12px 30px',
                  fontSize: '1.1em',
                  borderRadius: '25px',
                  border: 'none',
                  background: loadingMore ? '#ccc' : '#B6407D',
                  color: '#fff',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(182, 64, 125, 0.3)'
                }}
              >
                {loadingMore ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '8px' }}></i>
                    Cargando...
                  </>
                ) : (
                  <>
                    <i className="bx bx-plus-circle" style={{ marginRight: '8px' }}></i>
                    Cargar Más Libros
                  </>
                )}
              </button>
            </div>
          )}

          {/* ✅ Mensaje cuando no hay más libros */}
          {!hasMore && libros.length > 0 && (
            <div className="text-center" style={{ margin: '40px 0', color: '#666' }}>
              <p>📚 Has visto todas las recomendaciones disponibles</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}