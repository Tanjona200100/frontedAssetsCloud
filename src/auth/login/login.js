// auth/login/login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./login.css";
import logo from "../../assets/images/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      // La redirection se fait automatiquement via le DashboardRouter
      // Mais on attend un peu pour que le contexte se mette à jour
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
    </div>
  );
};

export default Login;