// src/components/Sidebar.jsx
import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

  const userContext = useContext(UserContext);
  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userName, setUserName] = useState('Utilisateur');
  const [userRole, setUserRole] = useState('Utilisateur');
  const [badgeRole, setBadgeRole] = useState('USER');
  const [userAvatar, setUserAvatar] = useState(null);
  const [userAccent, setUserAccent] = useState('#3B82F6');
  const [storageText, setStorageText] = useState('0 / 50 GB');
  const [storagePercent, setStoragePercent] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Référence pour suivre si le composant est monté
  const isMounted = useRef(true);

  // Mémoriser le rôle actuel
  const currentRole = useMemo(() => {
    if (isAdminRoute && user) {
      return user.role || 'admin';
    } else if (!isAdminRoute && userContext?.role) {
      return userContext.role;
    }
    return 'user';
  }, [isAdminRoute, user, userContext?.role]);

  const isAdmin = currentRole === 'admin';

  // Fonctions de formatage mémorisées
  const formatRoleForBadge = useCallback((roleName) => {
    if (!roleName) return 'USER';
    switch (roleName.toLowerCase()) {
      case 'admin':
      case 'administrateur': return 'ADMIN';
      case 'developpeur':
      case 'dev':
      case 'developer':      return 'DEV';
      case 'graphiste':
      case 'designer':
      case 'design':         return 'DESIGN';
      default:               return roleName.toUpperCase().substring(0, 5);
    }
  }, []);

  const formatRoleForDisplay = useCallback((roleName) => {
    if (!roleName) return 'Utilisateur';
    switch (roleName.toLowerCase()) {
      case 'admin':
      case 'administrateur': return 'Administrateur';
      case 'developpeur':
      case 'dev':
      case 'developer':      return 'Développeur';
      case 'graphiste':
      case 'designer':
      case 'design':         return 'Graphiste';
      default:               return roleName.charAt(0).toUpperCase() + roleName.slice(1);
    }
  }, []);

  const getNavItems = useCallback(() => {
    if (isAdmin) {
      return [
        { id: "dashboard", label: "Dashboard",      icon: "dashboard" },
        { id: "users",     label: "Utilisateurs",   icon: "users",    badge: totalUsers.toString(), showBadge: true },
        { id: "assets",    label: "Assets",          icon: "assets",   badge: "3", badgeRed: true },
        { id: "stats",     label: "Statistiques",    icon: "stats" },
        { id: "roles",     label: "Rôles & Accès",   icon: "roles" },
        { id: "settings",  label: "Paramètres",      icon: "settings" }
      ];
    }
    return [
      { id: "dashboard", label: "Dashboard",         icon: "dashboard" },
      { id: "projects",  label: "Mes projets",        icon: "projects",  badge: "12" },
      { id: "assets",    label: "Assets techniques",  icon: "assets",    badge: "284" },
      { id: "history",   label: "Historique",         icon: "history" },
      { id: "profile",   label: "Profil",             icon: "profile" },
      { id: "settings",  label: "Paramètres",         icon: "settings" }
    ];
  }, [isAdmin, totalUsers]);

  const getIcon = useCallback((iconName) => {
    const adminIcons = {
      dashboard: <MdOutlineDashboard />,
      users:     <FiUsers />,
      assets:    <FaRegImages />,
      stats:     <IoIosStats />,
      roles:     <GiPoliceBadge />,
      settings:  <CiSettings />
    };
    const userIcons = {
      dashboard: Icons.grid,
      projects:  Icons.folder,
      assets:    Icons.file,
      history:   Icons.clock,
      profile:   Icons.user,
      settings:  Icons.cog,
    };
    if (isAdmin) {
      return adminIcons[iconName] || null;
    } else {
      const iconSvg = userIcons[iconName];
      return iconSvg ? <span dangerouslySetInnerHTML={{ __html: iconSvg }} /> : null;
    }
  }, [isAdmin]);

  const fetchTotalUsers = useCallback(async () => {
    if (!isAdmin || !isAdminRoute) return;
    try {
      setLoadingUsers(true);
      const data = await apiRequest('/admin/users/pending');
      const users = data.users || [];
      if (isMounted.current) {
        setTotalUsers(users.length);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      if (isMounted.current) {
        setLoadingUsers(false);
      }
    }
  }, [isAdmin, isAdminRoute]);

  // Effet pour les données admin
  useEffect(() => {
    if (isAdmin && isAdminRoute) {
      fetchTotalUsers();
      const interval = setInterval(fetchTotalUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, isAdminRoute, fetchTotalUsers]);

  // Effet pour les données utilisateur admin
  useEffect(() => {
    if (isAdminRoute && user) {
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || user.email || 'Administrateur';
      setUserName(fullName);
      const roleName = user.role || 'admin';
      setUserRole(formatRoleForDisplay(roleName));
      setBadgeRole(formatRoleForBadge(roleName));
      setUserAccent('#3B82F6');
      setUserAvatar(user.profile_image_url || null);
    }
  }, [user, isAdminRoute, formatRoleForDisplay, formatRoleForBadge]);

  // ✅ EFFET CORRIGÉ POUR LES DONNÉES NON-ADMIN (ligne 197)
  // Utilisation d'une référence pour éviter les boucles infinies
  const previousUserContextRef = useRef();

  useEffect(() => {
    // Vérifier si le contexte a vraiment changé
    if (!isAdminRoute && userContext) {
      // Comparer avec la valeur précédente pour éviter les mises à jour inutiles
      const contextChanged = JSON.stringify(previousUserContextRef.current) !== JSON.stringify(userContext);
      
      if (contextChanged) {
        const firstName = userContext.userData?.first_name || userContext.config?.first_name || '';
        const lastName = userContext.userData?.last_name || userContext.config?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || userContext.config?.name || 'Utilisateur';
        
        setUserName(fullName);
        
        const roleFromContext = userContext.role || userContext.config?.role || 'user';
        setUserRole(formatRoleForDisplay(roleFromContext));
        setBadgeRole(formatRoleForBadge(roleFromContext));
        setUserAccent(userContext.config?.accent || '#3B82F6');
        setStorageText(userContext.config?.smTxt || '0 / 50 GB');
        setStoragePercent(userContext.config?.smPct || 0);
        
        const avatar = userContext.config?.ava || userContext.userData?.profile_image_url;
        setUserAvatar(avatar);
        
        // Mettre à jour la référence
        previousUserContextRef.current = userContext;
      }
    }
  }, [userContext, isAdminRoute, formatRoleForDisplay, formatRoleForBadge]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLogoutClick = useCallback(() => setShowConfirmModal(true), []);
  const handleCloseModal = useCallback(() => setShowConfirmModal(false), []);
  
  const handleConfirmLogout = useCallback(async () => {
    setShowConfirmModal(false);
    setIsLoggingOut(true);
    try {
      if (isAdminRoute && logout) await logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
      sessionStorage.clear();
      navigate(isAdminRoute ? '/admin/login' : '/login', { replace: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate(isAdminRoute ? '/admin/login' : '/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }, [isAdminRoute, logout, navigate]);

  const getInitials = useCallback(() => {
    const firstName = userContext?.userData?.first_name || userContext?.config?.first_name;
    const lastName = userContext?.userData?.last_name || userContext?.config?.last_name;
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (userName && userName !== 'Utilisateur' && userName !== 'Administrateur')
      return userName.charAt(0).toUpperCase();
    if (isAdminRoute) return 'AD';
    if (currentRole === 'developpeur') return 'DV';
    if (currentRole === 'graphiste')   return 'DS';
    return 'UT';
  }, [userContext, userName, isAdminRoute, currentRole]);

  const getBadgeClass = useCallback(() => {
    switch (badgeRole) {
      case 'ADMIN':  return 'sb-badge admin-badge';
      case 'DEV':    return 'sb-badge dev-badge';
      case 'DESIGN': return 'sb-badge design-badge';
      default:       return 'sb-badge';
    }
  }, [badgeRole]);

  const isUrlAvatar = userAvatar && !userAvatar.startsWith('linear') && !userAvatar.startsWith('radial');
  const avatarStyle = isUrlAvatar
    ? { backgroundImage: `url(${userAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: userAvatar || userAccent || '#3B82F6' };

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
          <span className={getBadgeClass()}>{badgeRole}</span>
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
          <div className="admin-avatar" title={userName} style={avatarStyle}>
            {(!isUrlAvatar && !userAvatar) && getInitials()}
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

      {showConfirmModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-theme">
              <div className="modal-header-icon"><CiLogout size={24} /></div>
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