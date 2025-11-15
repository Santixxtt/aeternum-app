import { useState, useEffect } from 'react';
import '../assets/css/reset_password.css';

const API_BASE_URL = "http://192.168.1.2:8000";

const App = () => {
    const [view, setView] = useState('loading'); 
    const [token, setToken] = useState(null);
    const [correo, setCorreo] = useState('');
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Estados para mostrar/ocultar contraseñas
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        
        if (urlToken) {
            setToken(urlToken);
            setView('reset');
        } else {
            setView('request');
        }
    }, []);

    // Calcular progreso de la barra
    const getPasswordProgress = () => {
        if (!nuevaContrasena) {
            return { width: 0, color: '#444' }; // Gris
        }
        
        if (nuevaContrasena.length < 8) {
            return { width: 25, color: '#444' }; // Gris (contraseña muy corta)
        }
        
        if (!confirmarContrasena) {
            return { width: 50, color: '#38a169' }; // Verde 50%
        }
        
        if (nuevaContrasena === confirmarContrasena) {
            return { width: 100, color: '#38a169' }; // Verde 100%
        }
        
        return { width: 50, color: '#ffc107' }; // Amarillo 50%
    };

    const handleRequestRecovery = async () => {
        if (!correo) {
            setMensaje("Por favor, ingresa tu correo electrónico.");
            return;
        }

        setIsLoading(true);
        setMensaje('');

        try {
            const apiUrl = `${API_BASE_URL}/password/recuperar_contrasena?correo=${encodeURIComponent(correo)}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                setMensaje("Si el correo está registrado, recibirás un enlace de recuperación. Revisa tu bandeja de entrada.");
                setView('success');
            } else {
                const data = await response.json();
                setMensaje(data.detail || "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo.");
                setView('error');
            }

        } catch (error) {
            console.error("Error de red:", error);
            setMensaje("No se pudo conectar con el servidor. Verifica tu conexión.");
            setView('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (nuevaContrasena.length < 8) {
            setMensaje("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (nuevaContrasena !== confirmarContrasena) {
            setMensaje("Las contraseñas no coinciden.");
            return;
        }

        setIsLoading(true);
        setMensaje('');

        const MAX_RETRIES = 3;
        const DELAY_MS = 1000;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const apiUrl = `${API_BASE_URL}/password/restablecer_contrasena?token=${encodeURIComponent(token)}&nueva_contrasena=${encodeURIComponent(nuevaContrasena)}`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setMensaje("¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.");
                    setView('success');
                    return; 
                } else if (response.status === 400) {
                    setMensaje(data.detail || "El enlace de restablecimiento es inválido o ha expirado.");
                    setView('error');
                    return; 
                } else {
                    throw new Error(data.detail || `Error del servidor: ${response.status}`);
                }

            } catch (error) {
                console.error(`Intento ${attempt + 1} fallido:`, error);
                
                if (attempt === MAX_RETRIES - 1) {
                    setMensaje("No se pudo completar la operación. Inténtalo más tarde.");
                    setView('error');
                } else {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS * Math.pow(2, attempt)));
                }
            } finally {
                if (attempt === MAX_RETRIES - 1 || view === 'success' || view === 'error') {
                     setIsLoading(false);
                }
            }
        }
    };

    const BackArrowSVG = (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="reset-back-icon">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    );

    const EyeIcon = ({ show }) => (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ cursor: 'pointer', color: '#999' }}
        >
            {show ? (
                // Ojo abierto
                <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </>
            ) : (
                // Ojo cerrado
                <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </>
            )}
        </svg>
    );

    const renderRequestView = () => (
        <>
            <h2 className="text-3xl font-bold reset-section-title mb-6 text-center">Recuperar Contraseña</h2>
            <p className="reset-section-subtitle mb-6 text-center">Ingresa tu correo electrónico para recibir un enlace de restablecimiento.</p>
            <div className="reset-form-group">
                <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            <button
                onClick={handleRequestRecovery}
                className={`reset-btn ${isLoading ? 'reset-btn-loading' : ''}`}
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                    </div>
                ) : 'Enviar Enlace'}
            </button>
        </>
    );

    const renderResetView = () => {
        const progress = getPasswordProgress();
        
        return (
            <>
                <h2 className="text-3xl font-bold reset-section-title mb-6 text-center">Establecer Nueva Contraseña</h2>
                <p className="reset-section-subtitle mb-4 text-center">Ingresa y confirma tu nueva contraseña.</p>
                
                {/* Barra de progreso */}
                <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#333',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '30px',
                    position: 'relative'
                }}>
                    <div style={{
                        width: `${progress.width}%`,
                        height: '100%',
                        backgroundColor: progress.color,
                        transition: 'all 0.3s ease',
                        borderRadius: '10px'
                    }}></div>
                </div>
                
                <div className="reset-form-group" style={{ position: 'relative' }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Nueva Contraseña (mín. 8 caracteres)"
                        value={nuevaContrasena}
                        onChange={(e) => setNuevaContrasena(e.target.value)}
                        disabled={isLoading}
                        style={{ paddingRight: '45px' }}
                    />
                    <div 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <EyeIcon show={showPassword} />
                    </div>
                </div>

                <div className="reset-form-group" style={{ position: 'relative' }}>
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmar Contraseña"
                        value={confirmarContrasena}
                        onChange={(e) => setConfirmarContrasena(e.target.value)}
                        disabled={isLoading}
                        style={{ paddingRight: '45px' }}
                    />
                    <div 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                            position: 'absolute',
                            right: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <EyeIcon show={showConfirmPassword} />
                    </div>
                </div>
                
                <button
                    onClick={handleResetPassword}
                    className={`reset-btn ${isLoading ? 'reset-btn-loading' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Restableciendo...
                        </div>
                    ) : 'Restablecer Contraseña'}
                </button>
            </>
        );
    };

    const renderMessageView = (isSuccess) => (
        <div className={`p-6 rounded-xl reset-message ${isSuccess ? 'success' : 'error'}`}>
            <div className="flex items-center justify-center mb-4">
                {isSuccess ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-current" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-current" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
            <p className="text-lg font-semibold mb-4 text-center text-current">{isSuccess ? "Operación Exitosa" : "Error de Operación"}</p>
            <p className="text-center text-current">{mensaje}</p>
            <div className="flex justify-center mt-6">
                <a href="/" className="reset-btn p-3 rounded-lg font-semibold text-white transition duration-200 shadow-md">
                    {isSuccess ? 'Ir a Iniciar Sesión' : 'Volver al Inicio'}
                </a>
            </div>
        </div>
    );
    
    let content;

    switch (view) {
        case 'loading':
            content = (
                <div className="flex items-center justify-center p-12">
                     <svg className="animate-spin h-8 w-8 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     <p className="ml-4 text-current font-medium">Cargando...</p>
                 </div>
            );
            break;
        case 'request':
            content = renderRequestView();
            break;
        case 'reset':
            content = renderResetView();
            break;
        case 'success':
            content = renderMessageView(true);
            break;
        case 'error':
            content = renderMessageView(false);
            break;
        default:
            content = renderRequestView();
    }

    return (
        <>
            <div className="reset-page">
                <div className="reset-container">
                    <div className="reset-section">
                        <a href="/" className="reset-back-button">
                            {BackArrowSVG}
                        </a>
                        
                        {content}
                        
                        {view !== 'success' && view !== 'error' && mensaje && (
                            <div className="mt-6 p-4 reset-validation-message" role="alert">
                                <p className="font-medium">{mensaje}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default App;