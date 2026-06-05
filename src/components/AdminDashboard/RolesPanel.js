// components/AdminDashboard/RolesPanel.jsx
const RoleCard = ({ title, description, icon, iconBg, iconColor, permissions }) => {
  const getIcon = () => {
    switch (icon) {
      case "shield":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case "code":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16,18 22,12 16,6" />
            <polyline points="8,6 2,12 8,18" />
          </svg>
        );
      case "design":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="role-card">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor }}>
          {getIcon()}
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>{title}</div>
          <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{description}</div>
        </div>
      </div>
      {permissions.map((perm, idx) => (
        <div key={idx} className="perm-row">
          <div className={`perm-check ${perm.allowed ? "yes" : "no"}`}>
            {perm.allowed ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
          {perm.label}
        </div>
      ))}
    </div>
  );
};

const RolesPanel = () => {
  const roles = [
    {
      title: "Administrateur",
      description: "Accès total",
      icon: "shield",
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "var(--accent-blue)",
      permissions: [
        { label: "Gestion utilisateurs", allowed: true },
        { label: "Suppression assets", allowed: true },
        { label: "Statistiques globales", allowed: true },
        { label: "Gestion des rôles", allowed: true },
        { label: "Paramètres plateforme", allowed: true }
      ]
    },
    {
      title: "Développeur",
      description: "Upload & fichiers",
      icon: "code",
      iconBg: "rgba(139,92,246,0.15)",
      iconColor: "#A78BFA",
      permissions: [
        { label: "Gestion utilisateurs", allowed: false },
        { label: "Upload assets", allowed: true },
        { label: "Gestion ses propres fichiers", allowed: true },
        { label: "Statistiques globales", allowed: false },
        { label: "Paramètres plateforme", allowed: false }
      ]
    },
    {
      title: "Graphiste",
      description: "Upload & visuel",
      icon: "design",
      iconBg: "rgba(16,185,129,0.15)",
      iconColor: "var(--accent-green)",
      permissions: [
        { label: "Gestion utilisateurs", allowed: false },
        { label: "Upload assets visuels", allowed: true },
        { label: "Gestion ses propres fichiers", allowed: true },
        { label: "Statistiques globales", allowed: false },
        { label: "Paramètres plateforme", allowed: false }
      ]
    }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
      {roles.map((role, idx) => (
        <RoleCard key={idx} {...role} />
      ))}
    </div>
  );
};

export default RolesPanel;