// src/components/UserDashboard/UserSidebar.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../pages/UserDashboard';
import { Icons } from './icons';
import logo from "../../assets/images/logo.png";

export default function UserSidebar() {
  const { role, setPanel, panel, config } = useContext(UserContext);
  const navigate = useNavigate();

  // Fonction de déconnexion avec React Router
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      // Supprimer le token du localStorage
      localStorage.removeItem('token');
      
      // Supprimer les autres données de session
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Rediriger vers la page de connexion
      navigate('/login', { replace: true });
    }
  };

  return (
    <aside className="sidebar">
      <div className="sb-aurora" style={{ background: config.aurora }} />
      
      <div className="sb-brand">
        <img src={logo} alt="logo" className="login-logo" />
      </div>

      <div className="sb-user">
        <div className="u-ava" style={{ background: config.ava }}>{config.init}</div>
        <div className="u-info">
          <div className="u-name">{config.name}</div>
          <div className="u-role" style={{ color: config.accent }}>{config.role}</div>
        </div>
      </div>

      <div className="sb-storage">
        <div className="st-header">
          <span className="st-label">Stockage</span>
          <span className="st-val">{config.smTxt}</span>
        </div>
        <div className="st-track">
          <div className="st-fill" style={{ width: `${config.smPct}%`, background: config.accent }} />
        </div>
      </div>

      <nav className="sb-nav">
        {config.nav.map(item => (
          <a
            key={item.id}
            className={`nav-item ${panel === item.id ? 'active' : ''}`}
            onClick={() => setPanel(item.id)}
            style={panel === item.id ? { background: config.roleBg, color: config.accent } : {}}
          >
            {Icons[item.icon] && <span dangerouslySetInnerHTML={{ __html: Icons[item.icon] }} />}
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </a>
        ))}
      </nav>

      <div className="sb-foot">
        <span className="sb-foot-txt">AssetCloud v2.4.1</span>
        <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}