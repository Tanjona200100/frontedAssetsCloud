// src/components/Sidebar.jsx
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../pages/UserDashboard';
import { useAuth } from '../contexts/AuthContext';
import logo from "../assets/images/logo.png";
import { MdOutlineDashboard } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { FaRegImages } from "react-icons/fa6";
import { GiPoliceBadge } from "react-icons/gi";
import { IoIosStats } from "react-icons/io";
import { CiSettings } from "react-icons/ci";
import { CiLogout } from "react-icons/ci";
import { Icons } from './UserDashboard/icons';

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

export default function Sidebar({ activePanel, setActivePanel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Context selon la route
  const userContext = useContext(UserContext);
  const { user, logout, isAuthenticated, fetchProfile } = useAuth();
  
  // État local pour les données utilisateur
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userName, setUserName] = useState('Utilisateur');
  const [userRole, setUserRole] = useState('Utilisateur');
  const [badgeRole, setBadgeRole] = useState('USER');
  const [userAvatar, setUserAvatar] = useState(null);
  const [userAccent, setUserAccent] = useState('#3B82F6');
  const [storageText, setStorageText] = useState('0 / 50 GB');
  const [storagePercent, setStoragePercent] = useState(0);
  
  // État pour le nombre total d'utilisateurs (admin seulement)
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Déterminer le rôle
  let currentRole = 'user';
  if (isAdminRoute && user) {
    currentRole = user.role || 'admin';
  } else if (!isAdminRoute && userContext?.role) {
    currentRole = userContext.role;
  }
  
  const isAdmin = currentRole === 'admin';
  const isDeveloppeur = currentRole === 'developpeur';
  const isGraphiste = currentRole === 'graphiste';

  // Navigation items selon le rôle
  const getNavItems = () => {
    if (isAdmin) {
      // Menu pour ADMIN
      return [
        { id: "dashboard", label: "Dashboard", icon: "dashboard" },
        { id: "users", label: "Utilisateurs", icon: "users", badge: totalUsers.toString(), showBadge: true },
        { id: "assets", label: "Assets", icon: "assets", badge: "3", badgeRed: true },
        { id: "stats", label: "Statistiques", icon: "stats" },
        { id: "roles", label: "Rôles & Accès", icon: "roles" },
        { id: "settings", label: "Paramètres", icon: "settings" }
      ];
    } else if (isDeveloppeur) {
      // Menu pour DÉVELOPPEUR
      return [
        { id: "dashboard", label: "Dashboard", icon: "dashboard" },
        { id: "projects", label: "Mes projets", icon: "projects", badge: "12" },
        { id: "assets", label: "Assets techniques", icon: "assets", badge: "284" },
        { id: "history", label: "Historique", icon: "history" },
        { id: "profile", label: "Profil", icon: "profile" },
        { id: "settings", label: "Paramètres", icon: "settings" }
      ];
    } else if (isGraphiste) {
      // Menu pour GRAPHISTE
      return [
        { id: "dashboard", label: "Dashboard", icon: "dashboard" },
        { id: "gallery", label: "Galerie", icon: "gallery", badge: "1.2K" },
        { id: "collections", label: "Collections", icon: "collections", badge: "8" },
        { id: "favorites", label: "Favoris", icon: "favorites", badge: "47" },
        { id: "profile", label: "Profil", icon: "profile" },
        { id: "settings", label: "Paramètres", icon: "settings" }
      ];
    }
    
    // Menu par défaut
    return [
      { id: "dashboard", label: "Dashboard", icon: "dashboard" },
      { id: "profile", label: "Profil", icon: "profile" },
      { id: "settings", label: "Paramètres", icon: "settings" }
    ];
  };

  // Récupérer l'icône appropriée
  const getIcon = (iconName) => {
    // Icônes pour admin (React Icons)
    const adminIcons = {
      dashboard: <MdOutlineDashboard />,
      users: <FiUsers />,
      assets: <FaRegImages />,
      stats: <IoIosStats />,
      roles: <GiPoliceBadge />,
      settings: <CiSettings />
    };
    
    // Icônes pour users (SVG Icons)
    const userIcons = {
      dashboard: Icons.grid,
      projects: Icons.folder,
      assets: Icons.file,
      history: Icons.clock,
      profile: Icons.user,
      settings: Icons.cog,
      gallery: Icons.image,
      collections: Icons.layers,
      favorites: Icons.heart
    };
    
    if (isAdmin) {
      return adminIcons[iconName] || null;
    } else {
      const iconSvg = userIcons[iconName];
      return iconSvg ? <span dangerouslySetInnerHTML={{ __html: iconSvg }} /> : null;
    }
  };

  // Fonction pour récupérer le nombre total d'utilisateurs (admin seulement)
  const fetchTotalUsers = async () => {
    if (!isAdmin || !isAdminRoute) return;
    
    try {
      setLoadingUsers(true);
      const data = await apiRequest('/admin/users/pending');
      const users = data.users || [];
      setTotalUsers(users.length);
    } catch (error) {
      console.error("Erreur lors du chargement du nombre d'utilisateurs:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Rafraîchir le nombre d'utilisateurs pour l'admin
  useEffect(() => {
    if (isAdmin && isAdminRoute) {
      fetchTotalUsers();
      const interval = setInterval(fetchTotalUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, isAdminRoute]);

  // Mettre à jour les infos utilisateur
  useEffect(() => {
    if (isAdminRoute && user) {
      // Admin route - utiliser useAuth
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || user.email || 'Administrateur';
      setUserName(fullName);
      
      const roleName = user.role || 'admin';
      setUserRole(formatRoleForDisplay(roleName));
      setBadgeRole(formatRoleForBadge(roleName));
      setUserAccent('#3B82F6');
    } else if (!isAdminRoute && userContext?.config) {
      // User route - utiliser UserContext
      setUserName(userContext.config.name);
      setUserRole(userContext.config.role);
      setBadgeRole(formatRoleForBadge(currentRole));
      setUserAccent(userContext.config.accent || '#3B82F6');
      setStorageText(userContext.config.smTxt || '0 / 50 GB');
      setStoragePercent(userContext.config.smPct || 0);
      setUserAvatar(userContext.config.ava);
    }
  }, [user, userContext, isAdminRoute, currentRole]);

  // Fonctions de formatage
  const formatRoleForBadge = (roleName) => {
    if (!roleName) return 'USER';
    
    switch (roleName.toLowerCase()) {
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
        return roleName.toUpperCase().substring(0, 5);
    }
  };

  const formatRoleForDisplay = (roleName) => {
    if (!roleName) return 'Utilisateur';
    
    switch (roleName.toLowerCase()) {
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
        return roleName.charAt(0).toUpperCase() + roleName.slice(1);
    }
  };

  // Fonction de déconnexion
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
      if (isAdminRoute && logout) {
        await logout();
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
      sessionStorage.clear();
      
      const redirectPath = isAdminRoute ? '/admin/login' : '/login';
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      const redirectPath = isAdminRoute ? '/admin/login' : '/login';
      navigate(redirectPath, { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Obtenir les initiales
  const getInitials = () => {
    if (userName && userName !== 'Utilisateur' && userName !== 'Administrateur') {
      return userName.charAt(0).toUpperCase();
    }
    if (isAdminRoute) return 'AD';
    return currentRole === 'developpeur' ? 'JD' : 'CM';
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

  // Déterminer le panel actif
  const currentPanel = isAdminRoute ? activePanel : userContext?.panel;
  const handleSetPanel = isAdminRoute ? setActivePanel : userContext?.setPanel;

  const navItems = getNavItems();

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
              className={`nav-item ${currentPanel === item.id ? "active" : ""}`}
              onClick={() => handleSetPanel && handleSetPanel(item.id)}
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
        
        {/* Affichage du stockage seulement pour les utilisateurs non-admin */}
        {!isAdminRoute && (
          <div className="sb-storage" style={{ margin: '16px 20px', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="st-header">
              <span className="st-label">Stockage</span>
              <span className="st-val">{storageText}</span>
            </div>
            <div className="st-track">
              <div className="st-fill" style={{ width: `${storagePercent}%`, background: userAccent }} />
            </div>
          </div>
        )}
        
        <div className="sb-footer">
          <div 
            className="admin-avatar" 
            title={userName}
            style={userAvatar && !userAvatar.startsWith('linear') ? { backgroundImage: `url(${userAvatar})`, backgroundSize: 'cover' } : { background: userAvatar || '#3B82F6' }}
          >
            {(!userAvatar || userAvatar.startsWith('linear')) && getInitials()}
          </div>
          <div className="admin-info">
            <div className="admin-name">{userName}</div>
            <div className="admin-role">{userRole}</div>
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

      {/* Modal de confirmation de déconnexion */}
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
              <button className="modal-btn modal-btn-cancel" onClick={handleCloseModal}>
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
}