// auth/login/login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./login.css";
import logo from "../../assets/images/logo.png";

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // États pour le modal "Mot de passe oublié"
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      setTimeout(() => {
        const role = result.user?.role?.toLowerCase();
        if (role === 'admin' || role === 'administrateur') {
          navigate("/admindashboard");
        } else {
          navigate("/userdashboard");
        }
      }, 100);
    } else {
      setError(result.error || "Email ou mot de passe incorrect");
    }
    
    setLoading(false);
  };

  // Gestionnaire pour "Mot de passe oublié" - CORRECTION
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);

    try {
      // Utiliser l'URL complète avec la variable d'environnement
      const url = `${API_BASE_URL}/auth/forgot-password`;
      console.log("Calling forgot password API:", url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      console.log("Response status:", response.status);

      // Lire la réponse même en cas d'erreur
      const data = await response.json().catch(() => ({}));
      console.log("Response data:", data);

      if (response.ok) {
        setForgotSuccess(data.message || "Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.");
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotEmail("");
          setForgotSuccess("");
        }, 3000);
      } else {
        // Gérer les différents codes d'erreur
        if (response.status === 404) {
          setForgotError("Service de réinitialisation non disponible. Veuillez contacter l'administrateur.");
        } else if (response.status === 400) {
          setForgotError(data.error || "Email invalide. Veuillez vérifier votre saisie.");
        } else if (response.status === 404) {
          setForgotError("Aucun compte trouvé avec cet email.");
        } else {
          setForgotError(data.error || "Une erreur est survenue. Veuillez réessayer.");
        }
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setForgotError("Erreur de connexion au serveur. Veuillez réessayer plus tard.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="background-glow glow-blue"></div>
      <div className="background-glow glow-green"></div>

      <div className="login-card">
        <img src={logo} alt="logo" className="login-logo" />

        <h2>Connexion</h2>
        <p className="subtitle">Accédez à votre espace AssetCloud</p>

        {error && <div className="error-message">{error}</div>}

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
            
            {forgotError && <div className="error-message">{forgotError}</div>}
            {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}
            
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
    </div>
  );
};

export default Login;