// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardPanel from "../components/AdminDashboard/DashboardPanel";
import UsersPanel from "../components/AdminDashboard/UsersPanel";
import AssetsPanel from "../components/AdminDashboard/AssetsPanel/index";
import StatsPanel from "../components/AdminDashboard/StatsPanel";
import RolesPanel from "../components/AdminDashboard/RolesPanel";
import SettingsPanel from "../components/AdminDashboard/SettingsPanel";
import ProjectsPanel from "../components/AdminDashboard/ProjectsPanel";
import ProjectAssetsPage from "../components/AdminDashboard/ProjectAssetsPage";
import CategoriePanel from "../components/AdminDashboard/CategoriePanel/CategoriePanel";
import ProfilePanel from "../components/UserDashboard/ProfilePanel";
import "../components/AdminDashboard/adminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { panel: urlPanel, projectId: urlProjectId } = useParams();
  
  // États principaux
  const [activePanel, setActivePanel] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Refs pour le contrôle du flux
  const isInitialLoad = useRef(true);
  const navigationInProgress = useRef(false);
  const stateRestoredRef = useRef(false);
  const panelChangeFromUrl = useRef(false);
  const previousPanelRef = useRef("dashboard");

  // 🔄 Fonction pour mettre à jour l'URL
  const updateUrl = useCallback((panelName, projectId = null, replace = true) => {
    if (navigationInProgress.current) return;
    
    let path = '/admindashboard';
    
    if (panelName === 'project-assets' && projectId) {
      path = `/admindashboard/project-assets/${projectId}`;
    } else if (panelName && panelName !== 'dashboard') {
      path = `/admindashboard/${panelName}`;
    }
    
    console.log('🔄 Mise à jour URL Admin:', path);
    navigationInProgress.current = true;
    navigate(path, { replace });
    setTimeout(() => {
      navigationInProgress.current = false;
    }, 100);
  }, [navigate]);

  // 📂 Fonction pour ouvrir les assets d'un projet
  const openProjectAssets = useCallback((projectId) => {
    console.log('🟣 Admin - Ouverture des assets du projet:', projectId);
    if (!projectId) {
      console.warn('⚠️ Aucun projectId fourni');
      return;
    }
    previousPanelRef.current = activePanel;
    setSelectedProjectId(projectId);
    setActivePanel("project-assets");
    setSearchQuery("");
    updateUrl('project-assets', projectId);
  }, [activePanel, updateUrl]);

  // ⬅️ Fonction pour revenir à la liste des projets
  const backToProjects = useCallback(() => {
    console.log('🟣 Admin - Retour à la liste des projets');
    setSelectedProjectId(null);
    setActivePanel("gestion");
    setSearchQuery("");
    updateUrl('gestion');
  }, [updateUrl]);

  // 🧭 Navigation standard avec mise à jour URL
  const handleSetActivePanel = useCallback((newPanel) => {
    console.log('🟢 Admin - Changement panel:', newPanel);
    
    // Éviter les boucles
    if (newPanel === activePanel && newPanel !== 'project-assets') {
      console.log('ℹ️ Même panel, pas de changement');
      return;
    }
    
    if (newPanel === 'project-assets') {
      if (!selectedProjectId) {
        console.warn('⚠️ Impossible de naviguer vers project-assets sans ID');
        return;
      }
    }
    
    previousPanelRef.current = activePanel;
    setActivePanel(newPanel);
    
    if (newPanel !== 'project-assets') {
      setSelectedProjectId(null);
    }
    
    // Mettre à jour l'URL
    updateUrl(newPanel, newPanel === 'project-assets' ? selectedProjectId : null);
  }, [activePanel, selectedProjectId, updateUrl]);

  // 💾 Sauvegarder l'état complet dans sessionStorage
  const saveStateToStorage = useCallback(() => {
    if (isInitialLoad.current || isLoading) return;
    
    const stateToSave = {
      activePanel,
      selectedProjectId,
      searchQuery,
      timestamp: Date.now(),
      url: location.pathname
    };
    
    try {
      sessionStorage.setItem('adminDashboardState', JSON.stringify(stateToSave));
      sessionStorage.setItem('adminDashboardLastPanel', activePanel);
      if (selectedProjectId) {
        sessionStorage.setItem('adminDashboardLastProjectId', selectedProjectId);
      }
      console.log('💾 État Admin sauvegardé:', stateToSave);
    } catch (e) {
      console.error('❌ Erreur sauvegarde état:', e);
    }
  }, [activePanel, selectedProjectId, searchQuery, location.pathname, isLoading]);

  // 🔄 Restaurer l'état depuis sessionStorage
  const restoreStateFromStorage = useCallback(() => {
    if (stateRestoredRef.current) return false;
    
    try {
      // 1. Essayer de restaurer depuis l'état complet
      const savedState = sessionStorage.getItem('adminDashboardState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        // Vérifier si l'état est récent (moins de 10 minutes)
        const isRecent = Date.now() - parsed.timestamp < 600000;
        
        if (isRecent && parsed.activePanel) {
          console.log('🔄 Restauration Admin depuis sessionStorage:', parsed);
          
          // Restaurer la recherche
          if (parsed.searchQuery) {
            setSearchQuery(parsed.searchQuery);
          }
          
          // Restaurer le panel
          if (parsed.activePanel === 'project-assets' && parsed.selectedProjectId) {
            setSelectedProjectId(parsed.selectedProjectId);
            setActivePanel('project-assets');
            stateRestoredRef.current = true;
            return true;
          } else if (parsed.activePanel && parsed.activePanel !== 'dashboard') {
            setActivePanel(parsed.activePanel);
            setSelectedProjectId(null);
            stateRestoredRef.current = true;
            return true;
          } else if (parsed.activePanel === 'dashboard') {
            setActivePanel('dashboard');
            setSelectedProjectId(null);
            stateRestoredRef.current = true;
            return true;
          }
        }
      }
      
      // 2. Fallback: restaurer depuis les variables séparées
      const lastPanel = sessionStorage.getItem('adminDashboardLastPanel');
      const lastProjectId = sessionStorage.getItem('adminDashboardLastProjectId');
      
      if (lastPanel) {
        console.log('🔄 Restauration fallback - Panel:', lastPanel, 'ProjectId:', lastProjectId);
        
        if (lastPanel === 'project-assets' && lastProjectId) {
          setSelectedProjectId(lastProjectId);
          setActivePanel('project-assets');
        } else if (lastPanel && lastPanel !== 'dashboard') {
          setActivePanel(lastPanel);
          setSelectedProjectId(null);
        } else {
          setActivePanel('dashboard');
          setSelectedProjectId(null);
        }
        stateRestoredRef.current = true;
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('❌ Erreur restauration état:', e);
      return false;
    }
  }, []);

  // 🔄 Synchronisation avec l'URL au chargement initial
  useEffect(() => {
    if (!isInitialLoad.current) return;
    
    console.log('🔄 Synchronisation Admin avec URL:', { 
      urlPanel, 
      urlProjectId, 
      pathname: location.pathname,
      search: location.search
    });
    
    // Si l'URL contient des paramètres, on les priorise
    if (urlPanel === 'project-assets' && urlProjectId) {
      setSelectedProjectId(urlProjectId);
      setActivePanel('project-assets');
      console.log(`✅ Chargement direct des assets du projet ${urlProjectId}`);
      setIsLoading(false);
      isInitialLoad.current = false;
      return;
    }
    
    if (urlPanel && ['dashboard', 'users', 'assets', 'stats', 'roles', 'gestion', 'categorie', 'settings', 'profil'].includes(urlPanel)) {
      setActivePanel(urlPanel);
      console.log(`✅ Chargement direct du panel ${urlPanel}`);
      setIsLoading(false);
      isInitialLoad.current = false;
      return;
    }
    
    // Sinon, essayer de restaurer depuis sessionStorage
    const restored = restoreStateFromStorage();
    
    if (!restored) {
      // Si rien n'est restauré, aller au dashboard
      setActivePanel('dashboard');
      setSelectedProjectId(null);
      console.log('📊 Chargement du dashboard par défaut');
    }
    
    setIsLoading(false);
    isInitialLoad.current = false;
  }, [urlPanel, urlProjectId, location.pathname, restoreStateFromStorage]);

  // ✅ Validation et synchronisation du panel
  useEffect(() => {
    if (isInitialLoad.current || isLoading) return;
    
    const validPanels = ['dashboard', 'users', 'assets', 'stats', 'roles', 'gestion', 'project-assets', 'categorie', 'settings', 'profil'];
    
    // Vérifier si le panel est valide
    if (!validPanels.includes(activePanel)) {
      console.log('🟡 Panel invalide, reset à dashboard');
      handleSetActivePanel('dashboard');
      return;
    }
    
    // Si le panel est project-assets mais qu'il n'y a pas d'ID
    if (activePanel === 'project-assets' && !selectedProjectId) {
      console.log('🟡 Project-assets sans ID, retour à gestion');
      handleSetActivePanel('gestion');
      return;
    }
    
    // Sauvegarder l'état à chaque changement
    saveStateToStorage();
    
  }, [activePanel, selectedProjectId, isLoading, handleSetActivePanel, saveStateToStorage]);

  // 🔍 Gérer la recherche globale
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    console.log(`🔍 Recherche Admin: "${query}" dans le panel ${activePanel}`);
    // Sauvegarder la recherche
    setTimeout(() => saveStateToStorage(), 100);
  }, [activePanel, saveStateToStorage]);

  // 📋 Ouvrir/Fermer le modal
  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // 🎨 Rendu du panel actif
  const renderPanel = useCallback(() => {
    console.log(`🎨 Rendu du panel: ${activePanel}`, { 
      selectedProjectId, 
      searchQuery,
      isLoading 
    });
    
    switch (activePanel) {
      case "dashboard":
        return <DashboardPanel searchQuery={searchQuery} />;
      case "users":
        return <UsersPanel openModal={openModal} searchQuery={searchQuery} />;
      case "assets":
        return <AssetsPanel searchQuery={searchQuery} />;
      case "stats":
        return <StatsPanel searchQuery={searchQuery} />;
      case "roles":
        return <RolesPanel searchQuery={searchQuery} />;
      case "gestion":
        return <ProjectsPanel onOpenProject={openProjectAssets} searchQuery={searchQuery} />;
      case "project-assets":
        if (!selectedProjectId) {
          console.warn('⚠️ Pas de selectedProjectId, retour à la gestion');
          return <ProjectsPanel onOpenProject={openProjectAssets} searchQuery={searchQuery} />;
        }
        return <ProjectAssetsPage 
          projectId={selectedProjectId} 
          onBack={backToProjects} 
          searchQuery={searchQuery} 
        />;
      case "categorie":
        return <CategoriePanel searchQuery={searchQuery} />;
      case "settings":
        return <SettingsPanel searchQuery={searchQuery} />;
      case "profil":
        return <ProfilePanel searchQuery={searchQuery} />;
      default:
        console.warn(`⚠️ Panel inconnu: ${activePanel}, retour au dashboard`);
        return <DashboardPanel searchQuery={searchQuery} />;
    }
  }, [activePanel, searchQuery, selectedProjectId, isLoading, openModal, openProjectAssets, backToProjects]);

  // ⏳ Affichage du chargement
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#020617',
        color: '#E2E8F0'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '20px', fontSize: '14px', opacity: 0.7 }}>
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <Sidebar 
        activePanel={activePanel} 
        setActivePanel={handleSetActivePanel} 
      />
      <div className="admin-main">
        <Topbar 
          activePanel={activePanel}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
        />
        <div className="admin-content">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;