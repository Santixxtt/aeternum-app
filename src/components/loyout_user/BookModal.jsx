import React, { useState, useEffect, useCallback, useRef } from "react";
import CommentsEdit from "./CommentEdit" 
import PhysicalLoanModal from "./PhysicalLoanModal";
import defaultImage from "../../assets/img/book-placeholder.png";
import { jwtDecode } from 'jwt-decode';

export default function BookModal({ book, onClose, onAddToWishlist, isBookSaved, onRemoveFromWishlist, usuario, handleGuestAction }) {
    // console.log("🔵 Book recibido en modal:", book);
    // console.log("🔵 book.key:", book?.key);
    const [description, setDescription] = useState("Cargando resumen...");
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0); 
    const [averageRating, setAverageRating] = useState(0.0);
    const [totalVotes, setTotalVotes] = useState(0);
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState([]);
    const textareaRef = useRef(null);
    const [loadingReviews, setLoadingReviews] = useState(true); 
    const [reviewsRefreshKey] = useState(0);
    const [showPhysicalLoanModal, setShowPhysicalLoanModal] = useState(false);
    const token = localStorage.getItem("token");

    const [downloadInfo, setDownloadInfo] = useState({
        pdfLink: null,
        epubLink: null,
        textLink: null,
        hasAnyFormat: false
    });
    const [loadingDownload, setLoadingDownload] = useState(false);

    const [currentUserId, setCurrentUserId] = useState(null);
    const [activeCommentMenu, setActiveCommentMenu] = useState(null); 
    const [isEditing, setIsEditing] = useState(null); 
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); 

    const bookData = React.useMemo(() => ({
        titulo: book.title,
        autor: book.author_name?.[0] || "Desconocido",
        cover_id: book.cover_i || null,
        openlibrary_key: book.key,
    }), [book.title, book.author_name, book.cover_i, book.key]);

    const cleanOlKey = (olKey) => {
        let cleanedKey = olKey.startsWith('/') ? olKey.substring(1) : olKey;
        const parts = cleanedKey.split('/');
        return parts[parts.length - 1]; 
    };

    // ✅ FUNCIÓN MEJORADA CON DEBUGGING
    const handleToggleWishlist = () => {
    console.log("🔵 ===== handleToggleWishlist EJECUTADO =====");
    console.log("🔵 Props recibidas:", { isBookSaved, onRemoveFromWishlist, onAddToWishlist });
    console.log("🔵 book completo:", book);
    console.log("🔵 libro_id disponible:", book.libro_id);
    
    if (isBookSaved) {
        console.log("🔴 Intentando QUITAR de wishlist");
        if (onRemoveFromWishlist) {
            console.log("✅ onRemoveFromWishlist existe, llamando con book.id =", book.id || book.libro_id);
            // ✅ PASAR TODO EL OBJETO BOOK, LA FUNCIÓN EN ListaDeseos EXTRAERÁ EL ID
            onRemoveFromWishlist(book); 
        } else {
            console.error("❌ onRemoveFromWishlist NO está definido!");
        }
    } else {
        console.log("🟢 Intentando AGREGAR a wishlist");
        if (onAddToWishlist) {
            console.log("✅ onAddToWishlist existe, llamando...");
            onAddToWishlist(book);
        } else {
            console.error("❌ onAddToWishlist NO está definido!");
        }
    }
    console.log("🔵 ===== FIN handleToggleWishlist =====");
};

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setCurrentUserId(parseInt(decoded.sub));
            } catch (error) {
                console.error("Error al decodificar el token:", error);
                setCurrentUserId(null);
            }
        } else {
            setCurrentUserId(null);
        }
    }, [token]);
    
    const fetchUserRating = useCallback(async (olKey) => {
        if (!token) {
            setRating(0);
            return;
        }
        
        const key = cleanOlKey(olKey);
        
        try {
            const userRatingRes = await fetch(`http://127.0.0.1:8000/reviews/user-rating/${key}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const userRatingData = await userRatingRes.json();
            setRating(userRatingData.user_rating || 0); 
        } catch (error) {
            console.error("Error al cargar calificación del usuario:", error);
            setRating(0);
        }
    }, [token]);

    const fetchReviewsAndComments = useCallback(async (olKey) => {
        setLoadingReviews(true);
        const key = cleanOlKey(olKey);

        try {
            await fetchUserRating(olKey);

            const ratingsRes = await fetch(`http://127.0.0.1:8000/reviews/ratings/${key}`);
            const ratingsData = await ratingsRes.json();
            setAverageRating(ratingsData.promedio || 0.0);
            setTotalVotes(ratingsData.total_votos || 0);

            const commentsRes = await fetch(`http://127.0.0.1:8000/reviews/comments/${key}`);
            const commentsData = await commentsRes.json();
            setComments(commentsData.comments || []);
            
        } catch (error) {
            console.error("Error al cargar reviews/comentarios:", error);
        } finally {
            setLoadingReviews(false); 
        }
    }, [fetchUserRating]);
    
    useEffect(() => {
        const fetchDescription = async () => {
            setLoading(true);
            try {
                const url = `https://openlibrary.org${book.key}.json`;
                const res = await fetch(url);
                const data = await res.json();
                let newDescription = "No hay resumen disponible.";

                if (data.description) {
                    newDescription = typeof data.description === "string"
                        ? data.description
                        : data.description.value || newDescription;
                } else if (data.excerpt?.value) {
                    newDescription = data.excerpt.value;
                }

                setDescription(newDescription);
            } catch (err) {
                console.error("Error al cargar detalles del libro:", err);
                setDescription("Error al cargar resumen. Intenta de nuevo.");
            } finally {
                setLoading(false);
            }
        };

        if (book?.key) {
            fetchDescription();
        }
    }, [book]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [commentText]);

    useEffect(() => {
        if (bookData.openlibrary_key) {
            fetchUserRating(bookData.openlibrary_key);
            fetchReviewsAndComments(bookData.openlibrary_key);
        }
    }, [bookData.openlibrary_key, token, reviewsRefreshKey, fetchUserRating, fetchReviewsAndComments, isEditing, currentUserId]);

    // ✅ Reemplaza el useEffect de fetchDownloadLinks con este MEJORADO
useEffect(() => {
    const fetchDownloadLinks = async () => {
        if (!book?.key) return;
        
        setLoadingDownload(true);
        try {
            // Primero obtenemos el work para ver las ediciones
            const workUrl = `https://openlibrary.org${book.key}.json`;
            console.log("🔍 Buscando información del libro en:", workUrl);
            
            const workRes = await fetch(workUrl);
            const workData = await workRes.json();
            
            console.log("📦 Datos del work:", workData);
            
            // Obtener las ediciones del work
            const editionsUrl = `https://openlibrary.org${book.key}/editions.json`;
            console.log("📚 Buscando ediciones en:", editionsUrl);
            
            const editionsRes = await fetch(editionsUrl);
            const editionsData = await editionsRes.json();
            
            console.log("📚 Ediciones encontradas:", editionsData.entries?.length || 0);
            
            // Buscar la primera edición que tenga ocaid
            let iaId = null;
            
            for (const edition of editionsData.entries || []) {
                if (edition.ocaid) {
                    iaId = edition.ocaid;
                    console.log("✅ Edición con Internet Archive encontrada:", edition.key, "->", iaId);
                    break;
                }
                
                // También revisar en source_records
                if (edition.source_records) {
                    const iaRecord = edition.source_records.find(r => r.startsWith('ia:'));
                    if (iaRecord) {
                        iaId = iaRecord.replace('ia:', '');
                        console.log("✅ Internet Archive ID en source_records:", iaId);
                        break;
                    }
                }
            }
            
            console.log("🔎 ID final de Internet Archive:", iaId);
            
            if (iaId) {
                const baseUrl = `https://archive.org/download/${iaId}/${iaId}`;
                
                setDownloadInfo({
                    pdfLink: `${baseUrl}.pdf`,
                    epubLink: `${baseUrl}.epub`,
                    textLink: `${baseUrl}_djvu.txt`,
                    hasAnyFormat: true,
                    iaId: iaId
                });
                
                console.log("✅ Libro disponible en Internet Archive:", iaId);
                console.log("📥 Enlaces construidos:", {
                    pdf: `${baseUrl}.pdf`,
                    epub: `${baseUrl}.epub`,
                    archive: `https://archive.org/details/${iaId}`
                });
            } else {
                console.log("⚠️ Este libro no tiene PDF en Internet Archive");
                console.log("💡 Ediciones revisadas:", editionsData.entries?.length || 0);
                
                setDownloadInfo({
                    pdfLink: null,
                    epubLink: null,
                    textLink: null,
                    hasAnyFormat: false
                });
            }
        } catch (error) {
            console.error("❌ Error al obtener enlaces de descarga:", error);
            setDownloadInfo({
                pdfLink: null,
                epubLink: null,
                textLink: null,
                hasAnyFormat: false
            });
        } finally {
            setLoadingDownload(false);
        }
    };

    fetchDownloadLinks();
}, [book?.key]);

const handleDownload = () => {
    if (!usuario) {
        handleGuestAction();
        return;
    }
    
    if (loadingDownload) {
        alert("⏳ Buscando formatos disponibles...");
        return;
    }
    
    if (downloadInfo.hasAnyFormat) {
        // Abrir la página de Internet Archive donde están todos los formatos
        const archiveUrl = `https://archive.org/details/${downloadInfo.iaId}`;
        window.open(archiveUrl, "_blank");
        console.log("📥 Redirigiendo a Internet Archive:", book.title);
    } else {
        // Si no hay formatos, redirigir a Open Library
        alert("📚 Este libro no tiene descarga directa disponible. Te redirigiremos a Open Library para ver opciones de préstamo digital con nuestro aliado.");
        window.open(`https://openlibrary.org${book.key}`, "_blank");
    }
};


    const handleSubmitRating = async (newRating) => {
    if (!token) {
        alert("Debes iniciar sesión para calificar.");
        return;
    }
    if (newRating < 1 || newRating > 5) return;
    
    // ✅ Actualizar UI optimistamente (para feedback inmediato)
    const previousRating = rating;
    setRating(newRating);

    try {
        const res = await fetch("http://127.0.0.1:8000/reviews/rate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                puntuacion: newRating,
                libro: bookData,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            // ✅ Si falla, revertir al rating anterior
            setRating(previousRating);
            alert(`Error: ${err.detail || "Error al enviar la calificación."}`);
            return;
        }

        // ✅ Esperar un momento para que el backend procese
        await new Promise(resolve => setTimeout(resolve, 200));

        // ✅ Recargar datos frescos del servidor
        await fetchReviewsAndComments(bookData.openlibrary_key);
        
        console.log("✅ Calificación actualizada exitosamente");
        
    } catch (error) {
        console.error("Error en la solicitud de calificación:", error);
        // ✅ Si hay error de red, revertir
        setRating(previousRating);
        alert("No se pudo conectar al servidor para calificar.");
    }
};

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!token) {
            alert("Debes iniciar sesión para comentar.");
            return;
        }
        if (commentText.trim().length < 5) {
            alert("El comentario debe tener al menos 5 caracteres.");
            return;
        }

        try {
            const res = await fetch("http://127.0.0.1:8000/reviews/comment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    texto: commentText.trim(),
                    libro: bookData,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error: ${err.detail || "Error al enviar el comentario."}`);
            } else {
                alert("Comentario enviado con éxito.");
                setCommentText("");
                fetchReviewsAndComments(bookData.openlibrary_key);
            }
        } catch (error) {
            console.error("Error en la solicitud de comentario:", error);
            alert("No se pudo conectar al servidor para comentar.");
        }
    };

    const startEditComment = (comment) => {
        setActiveCommentMenu(null);
        setIsEditing(comment.id);
    };

    const cancelEditComment = () => {
        setIsEditing(null);
    };

    const handleEditComment = async (newText) => {
        const commentId = isEditing;

        if (!token) {
            alert("Debes iniciar sesión para editar.");
            return;
        }

        const trimmedText = newText.trim();
        if (trimmedText.length < 5) {
            alert("El comentario debe tener al menos 5 caracteres.");
            return;
        }

        try {
            setLoadingReviews(true); 
            
            const res = await fetch(`http://127.0.0.1:8000/reviews/comment/${commentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ texto: trimmedText }), 
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error al editar: ${err.detail || "Error al actualizar el comentario."}`);
            } else {
                alert("Comentario actualizado con éxito.");
            }
        } catch (error) {
            console.error("Error en la solicitud de edición:", error);
            alert("No se pudo conectar al servidor para editar el comentario.");
        } finally {
            cancelEditComment(); 
            fetchReviewsAndComments(bookData.openlibrary_key); 
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!token) {
            alert("Debes iniciar sesión para eliminar.");
            return;
        }

        if (!window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
            return;
        }

        try {
            setLoadingReviews(true);
            setActiveCommentMenu(null); 

            const res = await fetch(`http://127.0.0.1:8000/reviews/comment/${commentId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error al eliminar: ${err.detail || "Error al eliminar el comentario."}`);
            } else {
                alert("Comentario eliminado con éxito.");
            }
        } catch (error) {
            console.error("Error en la solicitud de eliminación:", error);
            alert("No se pudo conectar al servidor para eliminar el comentario.");
        } finally {
            fetchReviewsAndComments(bookData.openlibrary_key);
        }
    };


    const handleOverlayClick = (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            onClose();
        }
    };

    const imageUrl = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : defaultImage;
    
    const renderDescription = () => {
        if (loading) return <p>Cargando el resumen...</p>;
        if (!description || description === "No hay resumen disponible.") return <p>No hay resumen disponible.</p>;

        const MAX_CHARS = 260;
        const needsTruncation = description.length > MAX_CHARS; 

        if (isDescriptionExpanded || !needsTruncation) {
            return (
                <p>
                    {description}
                    {needsTruncation && (
                        <button 
                            onClick={() => setIsDescriptionExpanded(false)}
                            className="btn-link more-less"
                            >
                            menos
                        </button>
                    )}
                </p>
            );
        } else {
            const truncatedDescription = description.substring(0, MAX_CHARS) + '...';
            return (
              <p>
                {truncatedDescription}
                <button
                  onClick={() => setIsDescriptionExpanded(true)}
                  className="btn-link more-less"
                >
                  más
                </button>
              </p>
            );
        }
    };

    const CommentItem = ({ comment }) => {
        const isAuthor = currentUserId === comment.usuario_id;
        const isMenuOpen = activeCommentMenu === comment.id;

        if (isEditing === comment.id) {
            return null; 
        }

        return (
            <div key={comment.id} className="comment-item"> 
            <p>
                <strong>{comment.nombre_usuario ?? comment.nombre ?? 'Usuario Desconocido'}</strong>
            </p>
            <p>{comment.texto}</p>
            <small>{new Date(comment.fecha_comentario).toLocaleDateString()}</small>

            {isAuthor && (
                <div 
                    className="comment-options" 
                    onClick={() => setActiveCommentMenu(isMenuOpen ? null : comment.id)}
                >
                    <i className='bx bx-dots-vertical-rounded'></i>
                </div>
            )}

            {isAuthor && isMenuOpen && (
                <div className="comment-menu">
                    <button onClick={() => startEditComment(comment)}>
                        <i className='bx bx-edit-alt'></i> Editar
                    </button>
                    <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="btn-delete"
                    >
                        <i className='bx bx-trash'></i> Eliminar
                    </button>
                </div>
            )}
        </div>
    );
};

    // ✅ LOG AL RENDERIZAR EL MODAL
    console.log("📘 BookModal renderizando con:", { 
        isBookSaved, 
        libro_id: book.libro_id,
        title: book.title 
    });

    const handlePhysicalBorrow = () => {
        if (!usuario) {
            handleGuestAction();
            return;
        }
        setShowPhysicalLoanModal(true);
    };

const handleDigitalBorrow = async () => {
    if (!usuario) {
        handleGuestAction();
        return;
    }

    const token = localStorage.getItem("token");
    
    try {
        const res = await fetch("http://127.0.0.1:8000/prestamos/digital", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                openlibrary_key: book.key.replace("/works/", ""),
                titulo: book.title,
                autor: book.author_name?.[0] || "Desconocido",
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Error al registrar el préstamo");
        }

        if (data.status === "success") {
            const openLibraryUrl = `https://openlibrary.org${book.key}`;
            window.open(openLibraryUrl, "_blank");
        } else {
            throw new Error(data.message || "Error al registrar el préstamo");
        }

    } catch (error) {
        console.error("Error en préstamo digital:", error);
        alert("❌ No se pudo procesar el préstamo digital. Intenta de nuevo.");
    }
};

const handleWishlist = () => {
  if (!usuario) {
    handleGuestAction();
    return;
  }
  handleToggleWishlist();
};

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>
                    <i className="bx bx-x"></i>
                </button>

                <div className="modal-body">
                    <div className="modal-image">
                        <img
                            src={imageUrl}
                            alt={book.title}
                            onError={(e) => {
                                if (e.target.src !== defaultImage) {
                                    e.target.src = defaultImage;
                                }
                            }}
                        />
                    </div>

                    <div className="modal-info">
                        <h2>{book.title}</h2>
                        <p><strong>Autor:</strong> {book.author_name?.[0] || "Desconocido"}</p>

                        <section className="rating-section">
                            <h3>Calificación del Libro</h3>
                            {loadingReviews ? (
                                <p>Cargando estadísticas...</p>
                            ) : (
                                <>
                                    <p>
                                        Promedio: <strong>{averageRating.toFixed(1)} / 5</strong> ({totalVotes} votos)
                                    </p>
                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={star <= rating ? "star-active" : "star-inactive"}
                                                onClick={() => handleSubmitRating(star)}
                                            >
                                                &#9733;
                                            </span>
                                        ))}
                                        <p>Mi calificación: {rating > 0 ? `${rating} estrellas` : "Sin calificar"}</p>
                                    </div>
                                </>
                            )}
                        </section>

                        <div className="modal-description">
                            <h3>Resumen</h3>
                            {renderDescription()}
                        </div>
                        
                        <div className="modal-comments">
                            <h3>Comentarios</h3>

                            <div className="comments-feed-box">
                                {loadingReviews ? (
                                    <p>Cargando comentarios...</p>
                                ) : comments.length === 0 ? (
                                    <p>Aún no hay comentarios para este libro.</p>
                                ) : (
                                    <div className="comments-list">
                                        {comments.map((comment) => (
                                            <CommentItem key={comment.id} comment={comment} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {token && isEditing !== null ? (
                                <CommentsEdit 
                                    initialText={comments.find(c => c.id === isEditing)?.texto || ''}
                                    onSave={handleEditComment}
                                    onCancel={cancelEditComment}
                                    placeholder={`Editando comentario...`}
                                    nombreUsuario={comments.find(c => c.id === isEditing)?.nombre_usuario}
                                />
                            ) : token ? (
                                <form onSubmit={handleSubmitComment} className="comment-form">
                                    <textarea
                                        ref={textareaRef} 
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Escribe tu comentario..."
                                        required
                                    />
                                    <button type="submit" className="submit-button">
                                        <i className='bx bx-paper-plane'></i> Enviar
                                    </button>
                                </form>
                            ) : (
                                <p>Inicia sesión para dejar un comentario.</p>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button onClick={handlePhysicalBorrow}>
                                <i className="bxs-book"></i> Préstamo Físico
                            </button>

                            <button
                                className="btn-digital"
                                onClick={handleDigitalBorrow}
                            >
                                <i className="bxs-book-open"></i> Préstamo Digital
                            </button>

                            <button 
                                onClick={handleDownload}
                                disabled={loadingDownload}
                                title={downloadInfo.hasAnyFormat ? "Ver formatos disponibles" : "Ver en Open Library"}
                                className={downloadInfo.hasAnyFormat ? "btn-download-available" : ""}
                            >
                                <i className={loadingDownload ? "bx bx-loader-alt bx-spin" : "bxs-download"}></i> 
                                {loadingDownload ? "Buscando..." : downloadInfo.hasAnyFormat ? "Descargar" : "Descargar"}
                            </button>

                            <button 
                                onClick={handleWishlist} 
                                className={isBookSaved ? "btn-remove-wishlist" : "btn-add-wishlist"}
                            >
                                <i className={isBookSaved ? "bxs-trash" : "bxs-star"}></i> 
                                {isBookSaved ? "Quitar de Deseos" : "Lista de Deseos"}
                            </button>
                            {showPhysicalLoanModal && (
                            <PhysicalLoanModal
                                book={book}
                                usuario={usuario}
                                onClose={() => setShowPhysicalLoanModal(false)}
                            />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}