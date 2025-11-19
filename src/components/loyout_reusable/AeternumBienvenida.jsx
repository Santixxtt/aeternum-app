import { useState, useEffect } from 'react';

const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

const AeternumBallAnimation = ({ onComplete, isShortVersion = false }) => {
  const [phase, setPhase] = useState('initial');
  
  useEffect(() => {
    if (isShortVersion) {
      setPhase('logo');
      const timer = setTimeout(() => setPhase('fade'), 1200);
      return () => clearTimeout(timer);
    }
    
    const timers = [
      setTimeout(() => setPhase('bounce'), 100),
      setTimeout(() => setPhase('slide'), 2000),
      setTimeout(() => setPhase('logo'), 3200),
      setTimeout(() => setPhase('fade'), 5000),
      setTimeout(() => onComplete(), 5500)
    ];
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [isShortVersion, onComplete]);
  
  // 🎯 CORRECCIÓN: Calcular posición inicial correctamente
  const getBallPosition = () => {
    if (phase === 'logo' || phase === 'fade') {
      return {
        left: isMobile ? 'calc(50% + 95px)' : 'calc(48% + 260px)',
        top: isMobile ? '47%' : '52%',
        transform: 'translate(-50%, -50%)',
        transition: 'all 0.6s ease',
        zIndex: 10
      };
    }
    
    if (phase === 'slide') {
      return {
        left: '50%',
        top: '40%',
        transform: 'translate(-50%, -50%)',
        animation: 'slideRight 1s ease-out forwards',
        zIndex: 10
      };
    }
    
    if (phase === 'bounce') {
      return {
        left: '50%',
        top: '40%',
        transform: 'translate(-50%, -50%)',
        animation: 'aeternumBounce 1.8s cubic-bezier(0.5, 0, 0.5, 1)',
        zIndex: 10
      };
    }
    
    // Estado inicial: centrado y arriba (fuera de pantalla)
    return {
      left: '50%',
      top: '-50px',
      transform: 'translate(-50%, -50%)',
      transition: 'none',
      zIndex: 10
    };
  };
  
  return (
    <div style={{
      ...styles.container,
      opacity: phase === 'fade' ? 0 : 1,
      transition: 'opacity 0.5s ease'
    }}>
      {/* Pelota blanca */}
      <div style={{
        ...styles.ball,
        ...getBallPosition()
      }} />
      
      {/* Logo AETERNUM */}
      {(phase === 'logo' || phase === 'fade') && (
        <div style={{
          ...styles.logoContainer,
          animation: 'fadeInLetters 0.8s ease forwards'
        }}>
          {'AETERNUM'.split('').map((letter, i) => (
            <span
              key={i}
              style={{
                ...styles.letter,
                animationDelay: `${i * 0.08}s`
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      )}
      
      {/* Subtítulo */}
      {phase === 'logo' && (
        <div style={{
          ...styles.subtitle,
          animation: 'fadeIn 0.8s ease 0.6s forwards',
          opacity: 0
        }}>
          BIBLIOTECA DIGITAL
        </div>
      )}
    </div>
  );
};

// 🏠 Componente principal con lógica de cuándo mostrar
const AeternumBienvenida = ({ children }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState('full');
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const lastFullAnimation = localStorage.getItem('aeternumLastFullAnimation');
    const lastLogin = localStorage.getItem('aeternumLastLogin');
    const now = Date.now();
    
    const daysSinceFullAnimation = lastFullAnimation 
      ? (now - parseInt(lastFullAnimation)) / (1000 * 60 * 60 * 24)
      : 999;
    
    const hoursSinceLastLogin = lastLogin
      ? (now - parseInt(lastLogin)) / (1000 * 60 * 60)
      : 999;
    
    // 🎯 LÓGICA: Primera vez o después de 7 días → Completa
    if (!lastFullAnimation || daysSinceFullAnimation >= 7) {
      setShowAnimation(true);
      setAnimationType('full');
      localStorage.setItem('aeternumLastFullAnimation', now.toString());
    } 
    // Después de 12 horas → Corta
    else if (hoursSinceLastLogin >= 12) {
      setShowAnimation(true);
      setAnimationType('short');
    } 
    // Login reciente → Sin animación
    else {
      setShowAnimation(false);
      setIsReady(true);
    }
    
    localStorage.setItem('aeternumLastLogin', now.toString());
  }, []);
  
  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setIsReady(true);
  };
  
  // 🎯 CORRECCIÓN: Mientras la animación esté activa O no esté listo, mostrar pantalla negra
  if (showAnimation) {
    return (
      <AeternumBallAnimation 
        onComplete={handleAnimationComplete}
        isShortVersion={animationType === 'short'}
      />
    );
  }
  
  if (!isReady) {
    // Pantalla negra mientras se inicializa
    return <div style={styles.container}></div>;
  }
  
  return <>{children}</>;
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    overflow: 'hidden'
  },
  ball: {
    position: 'absolute',
    width: isMobile ? '12px' : '18px',
    height: isMobile ? '12px' : '18px',
    background: '#fff',
    borderRadius: '50%',
    boxShadow: isMobile ? '0 0 20px rgba(255,255,255,0.8)' : '0 0 40px rgba(255,255,255,0.9)',
    willChange: 'transform, left, top'
  },
  logoContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    gap: isMobile ? '4px' : '10px',
    fontSize: isMobile ? '32px' : '48px',
    fontWeight: '900',
    color: '#b150a8', 
    letterSpacing: isMobile ? '3px' : '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  letter: {
    display: 'inline-block',
    opacity: 0,
    animation: 'popIn 0.3s ease forwards'
  },
  subtitle: {
    position: 'absolute',
    top: isMobile ? 'calc(50% + 35px)' : 'calc(50% + 50px)',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: isMobile ? '10px' : '14px',
    fontWeight: '300',
    letterSpacing: isMobile ? '2px' : '4px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap'
  }
};

// 🎨 Inyectar animaciones CSS
if (typeof document !== 'undefined') {
  const styleId = 'aeternum-animations';
  if (!document.getElementById(styleId)) {
    const animations = document.createElement('style');
    animations.id = styleId;
    animations.textContent = `
      @keyframes aeternumBounce {
        0% {
          top: -50px;
          animation-timing-function: ease-in;
        }
        20% {
          top: 60%;
          animation-timing-function: ease-out;
        }
        35% {
          top: 45%;
          animation-timing-function: ease-in;
        }
        50% {
          top: 58%;
          animation-timing-function: ease-out;
        }
        62% {
          top: 48%;
          animation-timing-function: ease-in;
        }
        72% {
          top: 54%;
          animation-timing-function: ease-out;
        }
        82% {
          top: 50%;
          animation-timing-function: ease-in;
        }
        92% {
          top: 52%;
          animation-timing-function: ease-out;
        }
        100% {
          top: 50%;
        }
      }
      
      @keyframes slideRight {
        from {
          left: 50%;
        }
        to {
          left: ${isMobile ? 'calc(50% + 95px)' : 'calc(50% + 260px)'};
        }
      }
      
      @keyframes popIn {
        from {
          opacity: 0;
          transform: scale(0.5) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      
      @keyframes fadeInLetters {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      /* Responsive para móvil */
      @media (max-width: 768px) {
        .aeternum-logo {
          font-size: 32px !important;
          letter-spacing: 4px !important;
        }
      }
    `;
    document.head.appendChild(animations);
  }
}

export default AeternumBienvenida;