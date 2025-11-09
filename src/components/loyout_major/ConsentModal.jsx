import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function ConsentModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó el consentimiento
    const consentAccepted = localStorage.getItem('consentAccepted');
    if (!consentAccepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    // Guardar que el usuario aceptó
    localStorage.setItem('consentAccepted', 'true');
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-container ${isOpen ? 'show-modal' : ''}`}>
      <div className="modal-content modal-content-animated">
        <span className="close-button" onClick={handleClose}>&times;</span>
        <h2>Consentimiento Informado</h2>
        <p>
          Al utilizar este sitio web, usted acepta los términos de nuestra Política de Privacidad.
        </p>
        <p>
          Al hacer clic en "Aceptar", confirma que ha leído y está de acuerdo con nuestra{" "}
          < Link to="/politica-privacidad" style={{ color: '#B6407D', textDecoration: 'none' }}>Política de Privacidad</Link>
        </p>
        <button className="accept-button" onClick={handleAccept}>
          Aceptar
        </button>
      </div>
    </div>
  );
}

export default ConsentModal;