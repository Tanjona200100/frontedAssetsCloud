// register.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./register.css";
import logo from "../../assets/images/logo.png";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // États pour les popups
  const [popup, setPopup] = useState({
    show: false,
    type: '', // 'success', 'error', 'info'
    title: '',
    message: '',
    duration: 15000
  });

  const [formData, setFormData] = useState({
    last_name: "",
    first_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "developpeur",
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

  // Fermer le popup
  const closePopup = () => {
    setPopup(prev => ({ ...prev, show: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur lors de la saisie
    setError("");
  };

  const isStep1Complete = () =>
    formData.last_name.trim() !== "" &&
    formData.first_name.trim() !== "" &&
    formData.email.trim() !== "";

  const isStep2Complete = () =>
    formData.password !== "" &&
    formData.confirmPassword !== "" &&
    formData.password === formData.confirmPassword &&
    formData.password.length >= 6;

  const cleanErrorMessage = (backendError) => {
    if (!backendError) return "Une erreur est survenue lors de l'inscription.";
    if (typeof backendError === "string") {
      if (backendError.includes("first_name") || backendError.includes("Prénom"))
        return "Le prénom est requis";
      if (backendError.includes("last_name") || backendError.includes("Nom"))
        return "Le nom est requis";
      if (backendError.includes("email")) return "Email invalide";
      if (backendError.includes("password"))
        return "Le mot de passe doit contenir au moins 6 caractères";
      if (backendError.includes("role")) return "Rôle invalide";
      if (backendError.includes("duplicate") || backendError.includes("existe déjà"))
        return "Cet email est déjà utilisé";
      if (backendError.includes("requis") || backendError.includes("invalide"))
        return backendError;
    }
    return "Vérifiez vos informations et réessayez.";
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (!formData.last_name.trim()) {
        const errorMsg = "Le nom est requis.";
        setError(errorMsg);
        showPopup('error', 'Champ manquant', errorMsg);
        return;
      }
      if (!formData.first_name.trim()) {
        const errorMsg = "Le prénom est requis.";
        setError(errorMsg);
        showPopup('error', 'Champ manquant', errorMsg);
        return;
      }
      if (!formData.email.trim()) {
        const errorMsg = "L'email est requis.";
        setError(errorMsg);
        showPopup('error', 'Champ manquant', errorMsg);
        return;
      }
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(formData.email)) {
        const errorMsg = "Veuillez entrer un email valide.";
        setError(errorMsg);
        showPopup('error', 'Email invalide', errorMsg);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.password) {
        const errorMsg = "Le mot de passe est requis.";
        setError(errorMsg);
        showPopup('error', 'Champ manquant', errorMsg);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        const errorMsg = "Les mots de passe ne correspondent pas.";
        setError(errorMsg);
        showPopup('error', 'Erreur de confirmation', errorMsg);
        return;
      }
      if (formData.password.length < 6) {
        const errorMsg = "Le mot de passe doit contenir au moins 6 caractères.";
        setError(errorMsg);
        showPopup('error', 'Mot de passe trop court', errorMsg);
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (step > 1) setStep(step - 1);
  };

  const handleCreateAccount = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const userData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      };

      const result = await register(userData);

      if (!result.success) {
        const cleanError = cleanErrorMessage(result.error);
        setError(cleanError);
        showPopup('error', 'Erreur d\'inscription', cleanError);
        setLoading(false);
        return;
      }

      setSuccess("Inscription réussie ! Redirection vers la connexion...");
      showPopup('success', 'Inscription réussie !', 'Votre compte a été créé avec succès. Redirection vers la connexion...');
      
      setTimeout(() => navigate("/login"), 2000);

    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      const errorMsg = "Une erreur est survenue lors de l'inscription.";
      setError(errorMsg);
      showPopup('error', 'Erreur', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <div className={`input-group ${formData.last_name ? 'filled' : ''}`}>
        <label>Nom *</label>
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder="Votre nom"
          autoComplete="family-name"
        />
      </div>
      <div className={`input-group ${formData.first_name ? 'filled' : ''}`}>
        <label>Prénom *</label>
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder="Votre prénom"
          autoComplete="given-name"
        />
      </div>
      <div className={`input-group ${formData.email ? 'filled' : ''}`}>
        <label>Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="exemple@email.com"
          autoComplete="email"
        />
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="input-group">
        <label>Mot de passe *</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Au moins 6 caractères"
          autoComplete="new-password"
          className={formData.password && formData.password.length < 6 ? 'error' : ''}
        />
        <small style={{ color: "#666", fontSize: "12px" }}>
          Minimum 6 caractères {formData.password && formData.password.length < 6 && '⚠️'}
        </small>
      </div>
      <div className="input-group">
        <label>Confirmer mot de passe *</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirmez votre mot de passe"
          autoComplete="new-password"
          className={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'error' : ''}
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <small style={{ color: "#ef4444", fontSize: "12px" }}>
            Les mots de passe ne correspondent pas
          </small>
        )}
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="input-group">
        <label>Rôle *</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="developpeur">Développeur</option>
          <option value="graphiste">Graphiste / Designer</option>
        </select>
        <small style={{ color: "#666", fontSize: "12px" }}>
          Sélectionnez votre rôle dans l'équipe
        </small>
      </div>
    </>
  );

  return (
    <div className="register-container">
      <div className="background-glow glow-blue"></div>
      <div className="background-glow glow-green"></div>

      <div className="register-card">
        <img src={logo} alt="logo" className="register-logo" />
        <h2>Créer un compte</h2>
        <p className="subtitle">Rejoignez AssetCloud</p>
        <div className="step-indicator">
          <span className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</span>
          <span className={`step-line ${step >= 2 ? 'active' : ''}`}></span>
          <span className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</span>
          <span className={`step-line ${step >= 3 ? 'active' : ''}`}></span>
          <span className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</span>
        </div>

        <div className="step-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="form-navigation">
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="nav-btn prev-btn"
              disabled={loading}
            >
              ← Retour
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="nav-btn next-btn"
              disabled={
                loading ||
                (step === 1 && !isStep1Complete()) ||
                (step === 2 && !isStep2Complete())
              }
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateAccount}
              className="register-btn-main"
              disabled={loading}
            >
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
          )}
        </div>

        <div className="login-link">
          <p>Déjà inscrit ?</p>
          <button onClick={() => navigate("/login")} type="button">
            Se connecter
          </button>
        </div>
      </div>

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

export default Register;