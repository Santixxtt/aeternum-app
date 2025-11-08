import BookCard from "./BookCard";

export default function Recomendados({ libros, onAddToWishlist, onBorrow, usuario, handleGuestAction }) {
  if (!libros || libros.length === 0) {
    return <div className="text-center py-10">No hay recomendaciones.</div>;
  }

  return (
    <section className="dashboard-user dashboard-book-list">
      {libros.map((book, index) => (
        <BookCard
          key={book.key || index}  // ✅ Mejor usar book.key como key único
          book={book}
          usuario={usuario}              
          onAddToWishlist={onAddToWishlist}
          onBorrow={onBorrow}
          handleGuestAction={handleGuestAction}
          isBookSaved={book.isBookSaved || false}  
          libro_id={book.libro_id}                  
        />
      ))}
    </section>
  );
}