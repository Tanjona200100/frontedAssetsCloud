// components/AdminDashboard/Sidebar.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from "../../assets/images/logo.png";
import { MdOutlineDashboard } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { FaRegImages } from "react-icons/fa6";
import { GiPoliceBadge } from "react-icons/gi";
import { IoIosStats } from "react-icons/io";
import { CiSettings } from "react-icons/ci";
import { CiLogout } from "react-icons/ci";
import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

// Fonction helper pour les requêtes API
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Une erreur est survenue');
  }
  
  return data;
};

const Sidebar = ({ activePanel, setActivePanel }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, fetchProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminName, setAdminName] = useState('Administrateur');
  const [adminRole, setAdminRole] = useState('Administrateur');
  const [badgeRole, setBadgeRole] = useState('ADMIN');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // État pour le nombre total d'utilisateurs
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fonction pour récupérer le nombre total d'utilisateurs
  const fetchTotalUsers = async () => {
    try {
      setLoadingUsers(true);
      // Utiliser la route existante pour récupérer tous les utilisateurs
      const data = await apiRequest('/admin/users/pending');
      const users = data.users || [];
      setTotalUsers(users.length);
    } catch (error) {
      console.error("Erreur lors du chargement du nombre d'utilisateurs:", error);
      // En cas d'erreur, essayer de récupérer depuis le localStorage ou garder 0
      const cachedUsers = localStorage.getItem('cachedUsers');
      if (cachedUsers) {
        try {
          const users = JSON.parse(cachedUsers);
          setTotalUsers(users.length);
        } catch (e) {
          setTotalUsers(0);
        }
      } else {
        setTotalUsers(0);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // Rafraîchir le nombre d'utilisateurs périodiquement ou lors de changements
  useEffect(() => {
    fetchTotalUsers();
    
    // Optionnel: Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchTotalUsers, 30000);
    
    // Nettoyer l'intervalle
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "users", label: "Utilisateurs", icon: "users", badge: totalUsers.toString(), showBadge: true },
    { id: "assets", label: "Assets", icon: "assets", badge: "3", badgeRed: true },
    { id: "stats", label: "Statistiques", icon: "stats" },
    { id: "roles", label: "Rôles & Accès", icon: "roles" },
    { id: "settings", label: "Paramètres", icon: "settings" }
  ];

  // Fonction pour formater le rôle en badge
  const formatRoleForBadge = (role) => {
    if (!role) return 'ADMIN';
    
    switch (role.toLowerCase()) {
      case 'admin':
      case 'administrateur':
        return 'ADMIN';
      case 'developpeur':
      case 'dev':
      case 'developer':
        return 'DEV';
      case 'graphiste':
      case 'designer':
      case 'design':
        return 'DESIGN';
      default:
        return role.toUpperCase().substring(0, 5);
    }
  };

  // Fonction pour formater l'affichage du rôle
  const formatRoleForDisplay = (role) => {
    if (!role) return 'Utilisateur';
    
    switch (role.toLowerCase()) {
      case 'admin':
      case 'administrateur':
        return 'Administrateur';
      case 'developpeur':
      case 'dev':
      case 'developer':
        return 'Développeur';
      case 'graphiste':
      case 'designer':
      case 'design':
        return 'Graphiste';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  useEffect(() => {
    if (user) {
      const firstName = user.first_name || user.prenom || '';
      const lastName = user.last_name || user.nom || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      setAdminName(fullName || user.email || 'Utilisateur');
      
      // Déterminer le rôle à partir de l'utilisateur
      const userRole = user.role || user.role_name || 'utilisateur';
      setAdminRole(formatRoleForDisplay(userRole));
      setBadgeRole(formatRoleForBadge(userRole));
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const firstName = parsedUser.first_name || parsedUser.prenom || '';
          const lastName = parsedUser.last_name || parsedUser.nom || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          setAdminName(fullName || parsedUser.email || 'Utilisateur');
          
          const userRole = parsedUser.role || parsedUser.role_name || 'utilisateur';
          setAdminRole(formatRoleForDisplay(userRole));
          setBadgeRole(formatRoleForBadge(userRole));
        } catch (error) {
          console.error('Erreur lors du parsing user:', error);
        }
      }
    }
  }, [user]);

  const getIcon = (iconName) => {
    switch (iconName) {
      case "dashboard":
        return <MdOutlineDashboard />;
      case "users":
        return <FiUsers />;
      case "assets":
        return <FaRegImages />;
      case "stats":
        return <IoIosStats />;
      case "roles":
        return <GiPoliceBadge />;
      case "settings":
        return <CiSettings />;
      default:
        return null;
    }
  };

  const handleLogoutClick = () => {
    setShowConfirmModal(true);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
  };

  const handleConfirmLogout = async () => {
    setShowConfirmModal(false);
    setIsLoggingOut(true);
    
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
      navigate('/admin/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const refreshProfile = async () => {
    if (isAuthenticated) {
      await fetchProfile();
    }
  };

  const getInitials = () => {
    if (adminName && adminName !== 'Administrateur') {
      return adminName.charAt(0).toUpperCase();
    }
    return 'AD';
  };

  // Déterminer la classe CSS pour le badge selon le rôle
  const getBadgeClass = () => {
    switch (badgeRole) {
      case 'ADMIN':
        return 'sb-badge admin-badge';
      case 'DEV':
        return 'sb-badge dev-badge';
      case 'DESIGN':
        return 'sb-badge design-badge';
      default:
        return 'sb-badge';
    }
  };

  return (
    <>
      <aside className="admin-sidebar">
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <img src={logo} alt="logo" className="login-logo" />
          </div>
          <span className={getBadgeClass()}>
            {badgeRole}
          </span>
        </div>
        
        <div className="sb-nav">
          <div className="sb-section">Navigation</div>
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activePanel === item.id ? "active" : ""}`}
              onClick={() => setActivePanel(item.id)}
            >
              {getIcon(item.icon)}
              {item.label}
              {item.showBadge !== false && item.badge && (
                <span className={`nav-badge ${item.badgeRed ? "red" : ""}`}>
                  {loadingUsers && item.id === "users" ? "..." : item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
        
        <div className="sb-footer">
          <div className="admin-avatar" title={adminName}>
            {getInitials()}
          </div>
          <div className="admin-info">
            <div className="admin-name">{adminName}</div>
            <div className="admin-role">{adminRole}</div>
          </div>
          <button 
            className="logout-btn" 
            onClick={handleLogoutClick} 
            title="Déconnexion"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? '...' : <CiLogout />}
          </button>
        </div>
      </aside>

      {/* Modale de confirmation de déconnexion avec le thème */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-theme">
              <div className="modal-header-icon">
                <CiLogout size={24} />
              </div>
              <h3>Confirmer la déconnexion</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
              <p className="modal-warning">
                <span className="warning-icon">⚠️</span>
                Vous devrez vous reconnecter pour accéder à nouveau à votre compte.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn modal-btn-cancel" 
                onClick={handleCloseModal}
              >
                Annuler
              </button>
              <button 
                className="modal-btn modal-btn-confirm" 
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Déconnexion en cours...' : 'Se déconnecter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;