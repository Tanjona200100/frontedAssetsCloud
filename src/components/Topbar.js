// components/AdminDashboard/Topbar.jsx
const panelTitles = {
  dashboard: { title: "Dashboard", subtitle: "Vue d'ensemble" },
  users: { title: "Utilisateurs", subtitle: "Gestion des comptes" },
  assets: { title: "Assets", subtitle: "Gestion des fichiers" },
  stats: { title: "Statistiques", subtitle: "Analyse globale" },
  roles: { title: "Rôles & Accès", subtitle: "Permissions" },
  settings: { title: "Paramètres", subtitle: "Configuration plateforme" }
};

const Topbar = ({ activePanel, searchQuery, setSearchQuery }) => {
  const current = panelTitles[activePanel] || panelTitles.dashboard;

  return (
    <div className="admin-topbar">
      <div className="topbar-title">
        {current.title} <span>{current.subtitle}</span>
      </div>
      <div className="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="search-input"
          placeholder="Rechercher utilisateurs, assets…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="topbar-right">
        <div className="icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notif-dot"></span>
        </div>
        <div className="top-avatar">AD</div>
      </div>
    </div>
  );
};

export default Topbar;