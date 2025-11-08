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

  const initialSrc = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
    : defaultImage;

  // Funciones de acción seguras para invitados
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
    // Aquí podrías implementar descarga real si quieres
    alert("Descargando libro..."); 
  };

  const handleRateClick = () => {
    if (!usuario) return handleGuestAction();
    // Aquí iría lógica de calificación
    alert("Califica este libro"); 
  };

  return (
    <>
      {/* Carta del libro */}
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

      {/* Modal con TODAS las props necesarias */}
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
          libro_id={libro_id}
        />
      )}
    </>
  );
};

export default BookCard;
