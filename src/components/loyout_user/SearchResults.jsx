import BookCard from "./BookCard";
import LoadingDots from "../loyout_reusable/LoadingDots";

export default function SearchResults({
  libros,
  loading,
  onAddToWishlist,
  onBorrow,
  usuario,
  handleGuestAction
}) {
  if (loading) {
    return (
      <div className="catalogo-loading-center">
        <LoadingDots message="Danos unos segundos..." />
        <div className="loading-sniper"></div>
      </div>
    );
  }

  if (!libros || libros.length === 0) {
    return (
      <div className="text-center py-10">
        Lo sentimos, no tenemos resultados para tu búsqueda. 😕
      </div>
    );
  }

  return (
    <section className="dashboard-user">
      <div className="text-center">
        <span className="dashboard-user mi-span">*</span>
        <h2 className="p-32">Resultados que encontramos</h2>
      </div>

      <div className="dashboard-book-list">
        {libros.map((book) => (
          <BookCard
            key={book.key}
            book={book}
            usuario={usuario}
            onAddToWishlist={onAddToWishlist}
            onBorrow={onBorrow}
            handleGuestAction={handleGuestAction}
          />
        ))}
      </div>
    </section>
  );
}
