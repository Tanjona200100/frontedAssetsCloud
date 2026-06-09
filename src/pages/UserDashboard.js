// src/pages/UserDashboard.jsx
import React, { useState, useEffect, createContext, useMemo, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardPanel from '../components/UserDashboard/DashboardPanel';
import ProjectsPanel from '../components/UserDashboard/ProjectsPanel';
import AssetsPanel from '../components/UserDashboard/AssetsPanel';
import HistoryPanel from '../components/UserDashboard/HistoryPanel';
import ProfilePanel from '../components/UserDashboard/ProfilePanel';
import SettingsPanel from '../components/UserDashboard/SettingsPanel';
import PreviewModal from '../components/UserDashboard/PreviewModal';
import FolderModal from '../components/UserDashboard/FolderModal';
import CollectionModal from '../components/UserDashboard/CollectionModal';
import '../components/UserDashboard/userDashboard.css';

export const UserContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

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
  const [role, setRole] = useState(null);
  const [panel, setPanel] = useState('dashboard');
  const [modals, setModals] = useState({ folder: false, collection: false, preview: false });
  const [previewData, setPreviewData] = useState({ name: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(userData);
  
  const isMounted = useRef(true);
  const dataFetchedRef = useRef(false);

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

  // ✅ CORRECTION: Fonction pour récupérer les données utilisateur depuis /users/me
  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ Pas de token trouvé');
      return null;
    }
    
    try {
      console.log('🔍 Fetching profile from:', `${API_BASE_URL}/users/me`);
      
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Données reçues de /users/me:', data);
        
        // Extraire l'utilisateur de la réponse
        const userProfile = data.user || data.data || data;
        console.log('👤 Profil utilisateur:', {
          id: userProfile.id,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          profile_image_url: userProfile.profile_image_url ? '✅ Présent' : '❌ Absent'
        });
        
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
      
      // Essayer de récupérer depuis localStorage d'abord
      if (!userInfo.first_name && !userInfo.role) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            userInfo = parsedUser;
            console.log('📦 Données depuis localStorage:', {
              role: userInfo.role,
              profile_image_url: userInfo.profile_image_url ? '✅ Présent' : '❌ Absent'
            });
          } catch (e) {
            console.error('Erreur lors du parsing user:', e);
          }
        }
      }
      
      // Si toujours pas de données, essayer depuis l'API
      if ((!userInfo.first_name || !userInfo.role) && !dataFetchedRef.current) {
        dataFetchedRef.current = true;
        console.log('🔄 Chargement depuis API...');
        const apiProfile = await fetchUserProfile();
        if (apiProfile) {
          userInfo = apiProfile;
          // Mettre à jour localStorage avec les données API
          localStorage.setItem('user', JSON.stringify(apiProfile));
          console.log('💾 localStorage mis à jour avec les données API');
        }
      }
      
      // Vérifier le rôle
      if (userInfo.role === 'developpeur' || userInfo.role === 'graphiste') {
        if (isMounted.current) {
          console.log('📸 UserDashboard - Données chargées:', {
            role: userInfo.role,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            profile_image_url: userInfo.profile_image_url ? '✅ Présent' : '❌ Absent',
            image_value: userInfo.profile_image_url ? userInfo.profile_image_url.substring(0, 100) : 'null'
          });
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

  // Validation du panel
  useEffect(() => {
    if (!role) return;
    
    const validPanels = ['dashboard', 'projects', 'assets', 'history', 'profile', 'settings'];
    
    if (!validPanels.includes(panel)) {
      setPanel('dashboard');
    }
  }, [role, panel]);

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
    setPanel,
    config,
    openModal,
    closeModal,
    openPreview,
    userData: contextUserData
  }), [role, panel, config, contextUserData, openModal, closeModal, openPreview]);

  const getCurrentPanel = useCallback(() => {
    if (!role) return <DashboardPanel />;
    
    switch (panel) {
      case 'dashboard':
        return <DashboardPanel />;
      case 'projects':
        return <ProjectsPanel />;
      case 'assets':
        return <AssetsPanel />;
      case 'history':
        return <HistoryPanel />;
      case 'profile':
        return <ProfilePanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardPanel />;
    }
  }, [role, panel]);

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
        <Sidebar activePanel={panel} setActivePanel={setPanel} />
        <div className="dashboard-main">
          <div className="dashboard-content">
            {getCurrentPanel()}
          </div>
        </div>
      </div>
      
      <FolderModal isOpen={modals.folder} onClose={() => closeModal('folder')} />
      <CollectionModal isOpen={modals.collection} onClose={() => closeModal('collection')} />
      <PreviewModal isOpen={modals.preview} onClose={() => closeModal('preview')} data={previewData} />
    </UserContext.Provider>
  );
}