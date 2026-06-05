// src/pages/UserDashboard.jsx
import React, { useState, useEffect, createContext } from 'react';
import Sidebar from '../components/Sidebar'; // Changé: utiliser le Sidebar unifié
import UserTopbar from '../components/UserDashboard/UserTopbar';
import DashboardPanel from '../components/UserDashboard/DashboardPanel';
import ProjectsPanel from '../components/UserDashboard/ProjectsPanel';
import AssetsPanel from '../components/UserDashboard/AssetsPanel';
import HistoryPanel from '../components/UserDashboard/HistoryPanel';
import ProfilePanel from '../components/UserDashboard/ProfilePanel';
import SettingsPanel from '../components/UserDashboard/SettingsPanel';
import GalleryPanel from '../components/UserDashboard/GalleryPanel';
import CollectionsPanel from '../components/UserDashboard/CollectionsPanel';
import FavoritesPanel from '../components/UserDashboard/FavoritesPanel';
import PreviewModal from '../components/UserDashboard/PreviewModal';
import FolderModal from '../components/UserDashboard/FolderModal';
import CollectionModal from '../components/UserDashboard/CollectionModal';
import '../components/UserDashboard/userDashboard.css';

export const UserContext = createContext();

const PANELS = {
  dev: {
    dashboard: DashboardPanel,
    assets: AssetsPanel,
    projects: ProjectsPanel,
    history: HistoryPanel,
    profile: ProfilePanel,
    settings: SettingsPanel,
  },
  gfx: {
    dashboard: DashboardPanel,
    gallery: GalleryPanel,
    collections: CollectionsPanel,
    favorites: FavoritesPanel,
    profile: ProfilePanel,
    settings: SettingsPanel,
  },
};

const TITLES = {
  dashboard: { main: 'Dashboard', sub: "Vue d'ensemble" },
  projects: { main: 'Mes projets', sub: 'Organisation des dossiers' },
  assets: { main: 'Assets techniques', sub: 'Tous mes fichiers' },
  gallery: { main: 'Galerie', sub: 'Mes créations visuelles' },
  collections: { main: 'Collections', sub: 'Organiser mes assets' },
  favorites: { main: 'Favoris', sub: 'Assets sauvegardés' },
  profile: { main: 'Mon profil', sub: 'Informations personnelles' },
  settings: { main: 'Paramètres', sub: 'Configuration' },
};

const CFG = {
  dev: {
    name: 'Jordan Durand',
    init: 'JD',
    role: 'developpeur', // Changé: 'developpeur' au lieu de 'dev'
    tag: 'DEV',
    accent: '#3B82F6',
    ava: 'linear-gradient(135deg,#1E3A8A,#3B82F6)',
    mark: 'linear-gradient(135deg,#1E3A8A,#3B82F6)',
    chipBg: 'rgba(59,130,246,0.15)',
    chipColor: '#3B82F6',
    roleBg: 'rgba(59,130,246,.08)',
    roleColor: '#3B82F6',
    aurora: 'radial-gradient(ellipse 200px 200px at 50% 0%,rgba(59,130,246,0.09) 0%,transparent 70%)',
    smTxt: '18.4 / 50 GB',
    smPct: 37,
    activeBefore: '#3B82F6',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
      { id: 'projects', label: 'Mes projets', icon: 'folder', badge: '12' },
      { id: 'assets', label: 'Assets techniques', icon: 'file', badge: '284' },
      { id: 'history', label: 'Historique', icon: 'clock' },
      { id: 'profile', label: 'Profil', icon: 'user' },
      { id: 'settings', label: 'Paramètres', icon: 'cog' },
    ],
  },
  gfx: {
    name: 'Camille Moreau',
    init: 'CM',
    role: 'graphiste', // Changé: 'graphiste' au lieu de 'gfx'
    tag: 'GRAPHISTE',
    accent: '#10B981',
    ava: 'linear-gradient(135deg,#064E3B,#10B981)',
    mark: 'linear-gradient(135deg,#064E3B,#10B981)',
    chipBg: 'rgba(16,185,129,0.15)',
    chipColor: '#10B981',
    roleBg: 'rgba(16,185,129,.08)',
    roleColor: '#10B981',
    aurora: 'radial-gradient(ellipse 200px 200px at 50% 0%,rgba(16,185,129,0.09) 0%,transparent 70%)',
    smTxt: '31.2 / 50 GB',
    smPct: 62,
    activeBefore: '#10B981',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
      { id: 'gallery', label: 'Galerie', icon: 'image', badge: '1.2K' },
      { id: 'collections', label: 'Collections', icon: 'layers', badge: '8' },
      { id: 'favorites', label: 'Favoris', icon: 'heart', badge: '47' },
      { id: 'profile', label: 'Profil', icon: 'user' },
      { id: 'settings', label: 'Paramètres', icon: 'cog' },
    ],
  },
};

export default function UserDashboard() {
  const [role, setRole] = useState('developpeur'); // Changé: 'developpeur' au lieu de 'dev'
  const [panel, setPanel] = useState('dashboard');
  const [modals, setModals] = useState({ folder: false, collection: false, preview: false });
  const [previewData, setPreviewData] = useState({ name: '', type: '' });

  const openModal = (modalName) => setModals(prev => ({ ...prev, [modalName]: true }));
  const closeModal = (modalName) => setModals(prev => ({ ...prev, [modalName]: false }));

  const openPreview = (name, type = 'file') => {
    setPreviewData({ name, type });
    setModals(prev => ({ ...prev, preview: true }));
  };

  const config = CFG[role === 'developpeur' ? 'dev' : 'gfx'];
  const CurrentPanel = PANELS[role === 'developpeur' ? 'dev' : 'gfx'][panel];

  useEffect(() => {
    const roleKey = role === 'developpeur' ? 'dev' : 'gfx';
    if (!PANELS[roleKey][panel]) setPanel('dashboard');
  }, [role, panel]);

  return (
    <UserContext.Provider value={{ role, setRole, panel, setPanel, config, openModal, closeModal, openPreview }}>
      <div className="dashboard-shell">
        <Sidebar /> {/* Utilise le Sidebar unifié */}
        <div className="dashboard-main">
          <UserTopbar title={TITLES[panel]} />
          <div className="dashboard-content">
            {CurrentPanel && <CurrentPanel />}
          </div>
        </div>
      </div>
      
      <FolderModal isOpen={modals.folder} onClose={() => closeModal('folder')} />
      <CollectionModal isOpen={modals.collection} onClose={() => closeModal('collection')} />
      <PreviewModal isOpen={modals.preview} onClose={() => closeModal('preview')} data={previewData} />
    </UserContext.Provider>
  );
}