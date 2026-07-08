// pages/AdminDashboard.jsx
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardPanel from "../components/AdminDashboard/DashboardPanel";
import UsersPanel from "../components/AdminDashboard/UsersPanel";
import AssetsPanel from "../components/AdminDashboard/AssetsPanel";
import StatsPanel from "../components/AdminDashboard/StatsPanel";
import RolesPanel from "../components/AdminDashboard/RolesPanel";
import SettingsPanel from "../components/AdminDashboard/SettingsPanel";
import AddUserModal from "../components/AdminDashboard/AddUserModal";
import ProjectsPanel from "../components/AdminDashboard/ProjectsPanel";
import ProjectAssetsPage from "../components/AdminDashboard/ProjectAssetsPage";
import CategoriePanel from "../components/AdminDashboard/CategoriePanel";
import ProfilePanel from "../components/UserDashboard/ProfilePanel";
import "../components/AdminDashboard/adminDashboard.css";

const AdminDashboard = () => {
  const [activePanel, setActivePanel] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Fonction pour ouvrir les assets d'un projet
  const openProjectAssets = (projectId) => {
    console.log('🟣 Ouverture des assets du projet:', projectId);
    setSelectedProjectId(projectId);
    setActivePanel("project-assets");
    setSearchQuery(""); // Réinitialiser la recherche
  };

  // Fonction pour revenir à la liste des projets
  const backToProjects = () => {
    console.log('🟣 Retour à la liste des projets');
    setSelectedProjectId(null);
    setActivePanel("gestion");
    setSearchQuery(""); // Réinitialiser la recherche
  };

  // Gérer la recherche globale
  const handleSearch = (query) => {
    setSearchQuery(query);
    // Vous pouvez ajouter ici une logique pour la recherche globale
    console.log(`🔍 Recherche: "${query}" dans le panel ${activePanel}`);
  };

  const renderPanel = () => {
    // Passer searchQuery aux panels qui le supportent
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
        return <ProjectAssetsPage projectId={selectedProjectId} onBack={backToProjects} searchQuery={searchQuery} />;
      case "categorie":
        return <CategoriePanel searchQuery={searchQuery} />;
      case "settings":
        return <SettingsPanel searchQuery={searchQuery} />;
      case "profil":
        return <ProfilePanel searchQuery={searchQuery} />;
      default:
        return <DashboardPanel searchQuery={searchQuery} />;
    }
  };

  return (
    <div className="admin-shell">
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
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
      <AddUserModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default AdminDashboard;