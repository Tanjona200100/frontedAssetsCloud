// pages/AdminDashboard.jsx
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/AdminDashboard/Topbar";
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
import "../components/AdminDashboard/adminDashboard.css";

const AdminDashboard = () => {
  const [activePanel, setActivePanel] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null); // ← Ajouté

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Fonction pour ouvrir les assets d'un projet
  const openProjectAssets = (projectId) => {
    console.log('🟣 Ouverture des assets du projet:', projectId);
    setSelectedProjectId(projectId);
    setActivePanel("project-assets");
  };

  // Fonction pour revenir à la liste des projets
  const backToProjects = () => {
    console.log('🟣 Retour à la liste des projets');
    setSelectedProjectId(null);
    setActivePanel("gestion");
  };

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return <DashboardPanel />;
      case "users":
        return <UsersPanel openModal={openModal} searchQuery={searchQuery} />;
      case "assets":
        return <AssetsPanel searchQuery={searchQuery} />;
      case "stats":
        return <StatsPanel />;
      case "roles":
        return <RolesPanel />;
      case "gestion":
        return <ProjectsPanel onOpenProject={openProjectAssets} />; // ← Passez la prop
      case "project-assets": // ← Nouveau panel
        return <ProjectAssetsPage projectId={selectedProjectId} onBack={backToProjects} />;
      case "categorie":
        return <CategoriePanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <DashboardPanel />;
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