import '../../assets/css/Loadingdots.css'; 

export default function LoadingDots({ message = "!!Cargando lo mejor para ti¡¡" }) {
  return (
    <div className="loading-dots-container">
      <p>{message}</p>
      <div className="loading-dots-animation">
        <div className="loading-dot dot-1"></div>
        <div className="loading-dot dot-2"></div>
        <div className="loading-dot dot-3"></div>
      </div>
    </div>
  );
}