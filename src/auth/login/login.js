// auth/login/login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./login.css";
import logo from "../../assets/images/logo.png";

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // États pour le modal "Mot de passe oublié"
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // États pour les popups
  const [popup, setPopup] = useState({
    show: false,
    type: '', // 'success', 'error', 'info'
    title: '',
    message: '',
    duration: 15000
  });

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Auto-fermeture du popup
  useEffect(() => {
    if (popup.show) {
      const timer = setTimeout(() => {
        setPopup(prev => ({ ...prev, show: false }));
      }, popup.duration || 15000);
      return () => clearTimeout(timer);
    }
  }, [popup.show, popup.duration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour afficher les popups
  const showPopup = (type, title, message, duration = 15000) => {
    setPopup({
      show: true,
      type,
      title,
      message,
      duration
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      showPopup('success', 'Connexion réussie', 'Bienvenue sur AssetCloud !');
      setTimeout(() => {
        const role = result.user?.role?.toLowerCase();
        if (role === 'admin' || role === 'administrateur') {
          navigate("/admindashboard");
        } else {
          navigate("/userdashboard");
        }
      }, 100);
    } else {
      const errorMsg = result.error || "Email ou mot de passe incorrect";
      setError(errorMsg);
      showPopup('error', 'Erreur de connexion', errorMsg);
    }
    
    setLoading(false);
  };

  // Gestionnaire pour "Mot de passe oublié"
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);

    try {
      const url = `${API_BASE_URL}/auth/forgot-password`;
      console.log("Calling forgot password API:", url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const successMsg = data.message || "Un email de réinitialisation a été envoyé.";
        setForgotSuccess(successMsg);
        showPopup('success', 'Email envoyé !', successMsg);
        
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotEmail("");
          setForgotSuccess("");
        }, 15000);
      } else {
        let errorMsg = "Une erreur est survenue. Veuillez réessayer.";
        
        if (response.status === 404) {
          errorMsg = "Service de réinitialisation non disponible. Veuillez contacter l'administrateur.";
        } else if (response.status === 400) {
          errorMsg = data.error || "Email invalide. Veuillez vérifier votre saisie.";
        } else if (response.status === 404) {
          errorMsg = "Aucun compte trouvé avec cet email.";
        } else if (response.status === 429) {
          errorMsg = "Trop de tentatives. Veuillez attendre quelques minutes.";
        } else if (response.status === 500) {
          errorMsg = "Erreur serveur. Veuillez réessayer plus tard.";
        }
        
        setForgotError(errorMsg);
        showPopup('error', 'Erreur', errorMsg);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMsg = "Erreur de connexion au serveur. Vérifiez votre connexion internet.";
      setForgotError(errorMsg);
      showPopup('error', 'Erreur de connexion', errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Fermer le popup
  const closePopup = () => {
    setPopup(prev => ({ ...prev, show: false }));
  };

  return (
    <div className="login-container">
      <div className="background-glow glow-blue"></div>
      <div className="background-glow glow-green"></div>

      <div className="login-card">
        <img src={logo} alt="logo" className="login-logo" />

        <h2>Connexion</h2>
        <p className="subtitle">Accédez à votre espace AssetCloud</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="votreemail@mail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="forgot-password-link">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="forgot-btn"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="register-section">
          <p>Vous n'avez pas encore de compte ?</p>
          <button
            type="button"
            className="register-btn"
            onClick={() => navigate("/register")}
          >
            Créer un compte
          </button>
        </div>
      </div>

      {/* Modal "Mot de passe oublié" */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowForgotPassword(false)}
            >
              ×
            </button>
            <h3>Réinitialisation du mot de passe</h3>
            <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
            
            <form onSubmit={handleForgotPassword}>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="votreemail@mail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="reset-btn"
                disabled={forgotLoading}
              >
                {forgotLoading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Popup de notification */}
      {popup.show && (
        <div className={`popup-overlay ${popup.type}`} onClick={closePopup}>
          <div className={`popup-container ${popup.type}`} onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={closePopup}>×</button>
            <div className="popup-icon">
              {popup.type === 'success' && '✅'}
              {popup.type === 'error' && '❌'}
              {popup.type === 'info' && 'ℹ️'}
            </div>
            <h4 className="popup-title">{popup.title}</h4>
            <p className="popup-message">{popup.message}</p>
            <div className="popup-progress-bar">
              <div className="popup-progress-fill"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;