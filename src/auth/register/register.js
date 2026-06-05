import { useState } from "react";
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
  const [imagePreview, setImagePreview] = useState(null);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    last_name: "",
    first_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "developpeur",
    image: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Veuillez sélectionner une image valide.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5MB.");
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, image: null }));
      setImagePreview(null);
    }
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
      if (!formData.last_name.trim()) { setError("Le nom est requis."); return; }
      if (!formData.first_name.trim()) { setError("Le prénom est requis."); return; }
      if (!formData.email.trim()) { setError("L'email est requis."); return; }
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(formData.email)) {
        setError("Veuillez entrer un email valide.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.password) { setError("Le mot de passe est requis."); return; }
      if (formData.password !== formData.confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (step > 1) setStep(step - 1);
  };

  // ✅ Appelée UNIQUEMENT via onClick du bouton — pas de form onSubmit
  const handleCreateAccount = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    const userData = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role
    };

    console.log("📝 Création manuelle du compte avec le rôle:", userData.role);

    const result = await register(userData);

    if (result.success) {
      setSuccess("Inscription réussie ! Redirection vers la connexion...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      const cleanError = cleanErrorMessage(result.error);
      setError(cleanError);
      console.error("Erreur complète:", result.error);
    }

    setLoading(false);
  };

  const renderStep1 = () => (
    <>
      <div className="input-group">
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
      <div className="input-group">
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
      <div className="input-group">
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
        />
        <small style={{ color: "#666", fontSize: "12px" }}>Minimum 6 caractères</small>
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
        />
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="input-group">
        <label>Photo de profil (optionnel)</label>
        <input
          type="file"
          name="image"
          accept="image/jpeg, image/png, image/jpg, image/gif"
          onChange={handleImageChange}
          className="file-input"
        />
        <small style={{ color: "#666", fontSize: "12px" }}>
          Formats acceptés : JPG, PNG, GIF (max 5MB)
        </small>
        {imagePreview && (
          <div className="image-preview">
            <img
              src={imagePreview}
              alt="Aperçu"
              style={{
                width: "100px",
                height: "100px",
                objectFit: "cover",
                borderRadius: "50%",
                marginTop: "10px",
                border: "2px solid #4a90e2"
              }}
            />
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, image: null }));
                setImagePreview(null);
              }}
              style={{
                marginLeft: "10px",
                padding: "5px 10px",
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>
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

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* ✅ Pas de onSubmit sur le form — zéro risque de submit automatique */}
        <div>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

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
        </div>

        <div className="login-link">
          <p>Déjà inscrit ?</p>
          <button onClick={() => navigate("/login")} type="button">
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;