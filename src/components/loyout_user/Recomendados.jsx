import BookCard from "./BookCard";

export default function Recomendados({ libros, onAddToWishlist, onBorrow, usuario, handleGuestAction }) {
  if (!libros || libros.length === 0) {
    return <div className="text-center py-10">No hay recomendaciones.</div>;
  }

  return (
    <section className="dashboard-user dashboard-book-list">
      {/* <h2>Recomendaciones para ti</h2> */}
  {libros.map((book, index) => (
     <BookCard
          key={index}
          book={book}
          usuario={usuario}              
          onAddToWishlist={onAddToWishlist}
          onBorrow={onBorrow}
          handleGuestAction={handleGuestAction}  
        />
  ))}
</section>

  );
}
