import { useState } from "react";
import BookModal from "./BookModal";
import defaultImage from "../../assets/img/book-placeholder.png";

const BookCard = ({ 
  book, 
  onAddToWishlist, 
  onBorrow, 
  usuario,
  handleGuestAction,
  isBookSaved = false,
  onRemoveFromWishlist,
  libro_id
}) => {
  const [open, setOpen] = useState(false);

  // 🔥 Determinar la imagen según si es local o de OpenLibrary
  const getImageSrc = () => {
    // Si es libro local Y tiene imagen local
    if (book.es_local && book.imagen_local) {
      return `https://backend-production-9f93.up.railway.app/uploads/${book.imagen_local}`;
    }
    
    // Si tiene cover_i de OpenLibrary
    if (book.cover_i) {
      return `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
    }
    
    // Imagen por defecto
    return defaultImage;
  };

  const initialSrc = getImageSrc();

  const handleWishlistClick = () => {
    if (!usuario) return handleGuestAction();
    onAddToWishlist && onAddToWishlist(book);
  };

  const handleBorrowClick = () => {
    if (!usuario) return handleGuestAction();
    onBorrow && onBorrow(book);
  };

  const handleDownloadClick = () => {
    if (!usuario) return handleGuestAction();
    alert("Descargando libro..."); 
  };

  const handleRateClick = () => {
    if (!usuario) return handleGuestAction();
    alert("Califica este libro"); 
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="dashboard-user book-card cursor-pointer"
      >
        <img
          src={initialSrc}
          alt={book.title}
          onError={(e) => {
            if (e.target.src !== defaultImage) {
              e.target.src = defaultImage;
            }
          }}
        />
        
        <h3>{book.title}</h3>
        <p>{book.author_name?.[0] || "Autor desconocido"}</p>
      </div>

      {open && (
        <BookModal
          book={book}
          onClose={() => setOpen(false)}
          usuario={usuario}
          onAddToWishlist={handleWishlistClick}
          onBorrow={handleBorrowClick}
          onDownload={handleDownloadClick}
          handleGuestAction={handleGuestAction}
          onRate={handleRateClick}
          isBookSaved={isBookSaved}
          onRemoveFromWishlist={onRemoveFromWishlist}
          libro_id={libro_id || book.libro_id}
        />
      )}
    </>
  );
};

export default BookCard;