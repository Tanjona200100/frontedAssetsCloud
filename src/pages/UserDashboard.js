// src/pages/UserDashboard.jsx
import React, { useState, useEffect, createContext, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DashboardPanel from '../components/UserDashboard/DashboardPanel';
import ProjectsPanel from '../components/UserDashboard/ProjectsPanel';
import ProjectAssetsPage from '../components/AdminDashboard/ProjectAssetsPage';
import AssetsPanel from '../components/UserDashboard/AssetsPanel/AssetsPanel';
import HistoryPanel from '../components/UserDashboard/HistoryPanel';
import ProfilePanel from '../components/UserDashboard/ProfilePanel';
import SettingsPanel from '../components/UserDashboard/SettingsPanel';
import PreviewModal from '../components/UserDashboard/PreviewModal';
import FolderModal from '../components/UserDashboard/FolderModal';
import '../components/UserDashboard/userDashboard.css';

export const UserContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Configuration unifiée pour les deux rôles
const getConfig = (role, userData = {}) => {
  const isDev = role === 'developpeur';
  const firstName = userData.first_name || '';
  const lastName = userData.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || (isDev ? 'Développeur' : 'Graphiste');
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (isDev ? 'DV' : 'GS');
  
  const profileImageUrl = userData.profile_image_url || null;
  
  return {
    first_name: firstName,
    last_name: lastName,
    email: userData.email || '',
    profile_image_url: profileImageUrl,
    name: displayName,
    init: initials,
    role: role,
    tag: isDev ? 'DEV' : 'GFX',
    accent: isDev ? '#3B82F6' : '#EC4899',
    ava: profileImageUrl 
      ? `url(${profileImageUrl})` 
      : (isDev 
        ? 'linear-gradient(135deg,#1E3A8A,#3B82F6)' 
        : 'linear-gradient(135deg,#831843,#EC4899)'),
    mark: isDev 
      ? 'linear-gradient(135deg,#1E3A8A,#3B82F6)' 
      : 'linear-gradient(135deg,#831843,#EC4899)',
    chipBg: isDev ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
    chipColor: isDev ? '#3B82F6' : '#EC4899',
    roleBg: isDev ? 'rgba(59,130,246,.08)' : 'rgba(236,72,153,.08)',
    roleColor: isDev ? '#3B82F6' : '#EC4899',
    aurora: isDev 
      ? 'radial-gradient(ellipse 200px 200px at 50% 0%,rgba(59,130,246,0.09) 0%,transparent 70%)'
      : 'radial-gradient(ellipse 200px 200px at 50% 0%,rgba(236,72,153,0.09) 0%,transparent 70%)',
    smTxt: '18.4 / 50 GB',
    smPct: 37,
    activeBefore: isDev ? '#3B82F6' : '#EC4899',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
      { id: 'projects', label: 'Mes projets', icon: 'folder', badge: '12' },
      { id: 'assets', label: 'Assets techniques', icon: 'file', badge: '284' },
      { id: 'history', label: 'Historique', icon: 'clock' },
      { id: 'profile', label: 'Profil', icon: 'user' },
      { id: 'settings', label: 'Paramètres', icon: 'cog' },
    ],
  };
};

export default function UserDashboard({ userData = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { panel: urlPanel, projectId: urlProjectId } = useParams();
  
  const [role, setRole] = useState(null);
  const [panel, setPanel] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [modals, setModals] = useState({ folder: false, collection: false, preview: false });
  const [previewData, setPreviewData] = useState({ name: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(userData);
  const [searchQuery, setSearchQuery] = useState("");
  
  const isMounted = useRef(true);
  const dataFetchedRef = useRef(false);
  const isInitialLoad = useRef(true);
  const navigationInProgress = useRef(false);

  // Fonction pour mettre à jour l'URL
  const updateUrl = useCallback((panelName, projectId = null) => {
    if (navigationInProgress.current) return;
    
    let path = '/userdashboard';
    
    if (panelName === 'project-assets' && projectId) {
      path = `/userdashboard/project-assets/${projectId}`;
    } else if (panelName && panelName !== 'dashboard') {
      path = `/userdashboard/${panelName}`;
    }
    
    navigationInProgress.current = true;
    navigate(path, { replace: true });
    setTimeout(() => {
      navigationInProgress.current = false;
    }, 100);
  }, [navigate]);

  // Fonction pour ouvrir les assets d'un projet
  const openProjectAssets = useCallback((projectId) => {
    if (!projectId) {
      console.warn('⚠️ Aucun projectId fourni');
      return;
    }
    setSelectedProjectId(projectId);
    setPanel('project-assets');
    setSearchQuery('');
    updateUrl('project-assets', projectId);
  }, [updateUrl]);

  // Fonction pour revenir à la liste des projets
  const backToProjects = useCallback(() => {
    setSelectedProjectId(null);
    setPanel('projects');
    setSearchQuery('');
    updateUrl('projects');
  }, [updateUrl]);

  // Navigation standard (avec mise à jour URL)
  const handleSetPanel = useCallback((newPanel) => {
    
    if (newPanel === 'project-assets') {
      // Ne pas changer le panel si c'est project-assets sans ID
      if (!selectedProjectId) {
        console.warn('⚠️ Impossible de naviguer vers project-assets sans ID');
        return;
      }
    }
    
    setPanel(newPanel);
    if (newPanel !== 'project-assets') {
      setSelectedProjectId(null);
    }
    updateUrl(newPanel, newPanel === 'project-assets' ? selectedProjectId : null);
  }, [selectedProjectId, updateUrl]);

  // Synchronisation avec l'URL au chargement
  useEffect(() => {
    if (!role || !isInitialLoad.current) return;
    
    
    // Vérifier si on est sur la page des assets d'un projet
    if (urlPanel === 'project-assets' && urlProjectId) {
      setSelectedProjectId(urlProjectId);
      setPanel('project-assets');
    } 
    // Vérifier si on est sur un autre panel
    else if (urlPanel && ['dashboard', 'projects', 'assets', 'history', 'profile', 'settings'].includes(urlPanel)) {
      setPanel(urlPanel);
    } 
    // Si pas de panel spécifié ou dashboard
    else if (!urlPanel || urlPanel === 'dashboard' || location.pathname === '/userdashboard') {
      setPanel('dashboard');
      if (location.pathname !== '/userdashboard' && !location.pathname.includes('/userdashboard/dashboard')) {
        updateUrl('dashboard');
      }
    }
    
    isInitialLoad.current = false;
  }, [role, urlPanel, urlProjectId, location.pathname, updateUrl]);

  // Validation du panel
  useEffect(() => {
    if (!role || isInitialLoad.current) return;
    
    const validPanels = ['dashboard', 'projects', 'project-assets', 'assets', 'history', 'profile', 'settings'];
    
    if (!validPanels.includes(panel)) {
      handleSetPanel('dashboard');
    }
  }, [role, panel, handleSetPanel]);

  const openModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  }, []);

  const openPreview = useCallback((name, type = 'file') => {
    setPreviewData({ name, type });
    setModals(prev => ({ ...prev, preview: true }));
  }, []);

  // Fonction pour récupérer les données utilisateur depuis /users/me
  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    try {
      
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      
      if (response.ok) {
        const data = await response.json();
        
        const userProfile = data.user || data.data || data;
       
        
        return userProfile;
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur API:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      return null;
    }
  }, []);

  // Récupérer le rôle et les données utilisateur
  useEffect(() => {
    const getUserData = async () => {
      let userInfo = { ...userData };
      
      if (!userInfo.first_name && !userInfo.role) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            userInfo = parsedUser;
          } catch (e) {
            console.error('Erreur lors du parsing user:', e);
          }
        }
      }
      
      if ((!userInfo.first_name || !userInfo.role) && !dataFetchedRef.current) {
        dataFetchedRef.current = true;
        const apiProfile = await fetchUserProfile();
        if (apiProfile) {
          userInfo = apiProfile;
          localStorage.setItem('user', JSON.stringify(apiProfile));
        }
      }
      
      if (userInfo.role === 'developpeur' || userInfo.role === 'graphiste') {
        if (isMounted.current) {
          setRole(userInfo.role);
          setCurrentUserData(userInfo);
          setLoading(false);
        }
      } else if (userInfo.role) {
        console.error('Rôle invalide:', userInfo.role);
        window.location.href = '/login';
      } else {
        console.error('Aucun rôle trouvé, redirection vers login');
        window.location.href = '/login';
      }
    };
    
    getUserData();
    
    return () => {
      isMounted.current = false;
    };
  }, [userData, fetchUserProfile]);

  // Sauvegarder l'état dans sessionStorage pour restauration après rechargement
  useEffect(() => {
    if (!loading && role) {
      const stateToSave = {
        panel,
        selectedProjectId,
        timestamp: Date.now()
      };
      sessionStorage.setItem('userDashboardState', JSON.stringify(stateToSave));
    }
  }, [panel, selectedProjectId, loading, role]);

  // Restaurer l'état depuis sessionStorage si nécessaire
  useEffect(() => {
    if (!loading && role && isInitialLoad.current) {
      const savedState = sessionStorage.getItem('userDashboardState');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          // Ne restaurer que si l'état est récent (moins de 5 minutes)
          if (Date.now() - parsed.timestamp < 300000) {
            if (parsed.panel === 'project-assets' && parsed.selectedProjectId) {
              setSelectedProjectId(parsed.selectedProjectId);
              setPanel('project-assets');
              // Mettre à jour l'URL
              updateUrl('project-assets', parsed.selectedProjectId);
            } else if (parsed.panel && parsed.panel !== 'dashboard') {
              setPanel(parsed.panel);
              updateUrl(parsed.panel);
            }
          }
        } catch (e) {
          console.error('Erreur restauration état:', e);
        }
      }
    }
  }, [loading, role, updateUrl]);

  // Mémoriser la config
  const config = useMemo(() => {
    if (!role) return null;
    return getConfig(role, currentUserData);
  }, [role, currentUserData]);

  const contextUserData = useMemo(() => ({
    first_name: currentUserData.first_name || '',
    last_name: currentUserData.last_name || '',
    email: currentUserData.email || '',
    profile_image_url: currentUserData.profile_image_url || null,
    ...currentUserData
  }), [currentUserData]);

  const contextValue = useMemo(() => ({
    role,
    setRole,
    panel,
    setPanel: handleSetPanel,
    config,
    openModal,
    closeModal,
    openPreview,
    openProjectAssets,
    backToProjects,
    userData: contextUserData
  }), [role, panel, config, contextUserData, openModal, closeModal, openPreview, openProjectAssets, backToProjects, handleSetPanel]);

  const getCurrentPanel = useCallback(() => {
    
    if (!role) return <DashboardPanel />;
    
    switch (panel) {
      case 'dashboard':
        return <DashboardPanel />;
      case 'projects':
        return <ProjectsPanel />;
      case 'project-assets':
        if (!selectedProjectId) {
          return <ProjectsPanel />;
        }
        return <ProjectAssetsPage 
          projectId={selectedProjectId} 
          onBack={backToProjects} 
          searchQuery={searchQuery} 
        />;
      case 'assets':
        return <AssetsPanel searchQuery={searchQuery} />;
      case 'history':
        return <HistoryPanel />;
      case 'profile':
        return <ProfilePanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardPanel />;
    }
  }, [role, panel, searchQuery, selectedProjectId, backToProjects]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0a0f1a',
        color: 'white'
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  if (!role) {
    return null;
  }

  return (
    <UserContext.Provider value={contextValue}>
      <div className="dashboard-shell">
        <Sidebar activePanel={panel} setActivePanel={handleSetPanel} />
        <div className="dashboard-main">
          <Topbar 
            activePanel={panel} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <div className="dashboard-content">
            {getCurrentPanel()}
          </div>
        </div>
      </div>
      
      <FolderModal isOpen={modals.folder} onClose={() => closeModal('folder')} />
      <PreviewModal isOpen={modals.preview} onClose={() => closeModal('preview')} data={previewData} />
    </UserContext.Provider>
  );
}