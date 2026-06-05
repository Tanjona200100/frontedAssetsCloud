// components/AdminDashboard/DashboardPanel.jsx
const StatCard = ({ icon, value, label, sub, delta, deltaUp, color }) => {
  const getIcon = () => {
    switch (icon) {
      case "users":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "images":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
        );
      case "videos":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23,7 16,12 23,17" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        );
      case "3d":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-top">
        <div className={`stat-icon ${color}`}>{getIcon()}</div>
        <span className={`stat-delta ${deltaUp ? "up" : "dn"}`}>{delta}</span>
      </div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
};

const ActivityItem = ({ icon, text, time, iconBg, iconColor }) => {
  const getIcon = () => {
    switch (icon) {
      case "upload":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        );
      case "user":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case "delete":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6l-1 14H6L5 6" />
          </svg>
        );
      case "role":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="activity-item">
      <div className="act-icon" style={{ background: iconBg, color: iconColor }}>
        {getIcon()}
      </div>
      <div className="act-info">
        <div className="act-text">{text}</div>
        <div className="act-time">{time}</div>
      </div>
    </div>
  );
};

const DashboardPanel = () => {
  return (
    <>
      <div className="stats-grid">
        <StatCard
          icon="users"
          value="2 847"
          label="Utilisateurs totaux"
          sub="+34 ce mois-ci"
          delta="+12%"
          deltaUp={true}
          color="blue"
        />
        <StatCard
          icon="images"
          value="184K"
          label="Images stockées"
          sub="2 430 cette semaine"
          delta="+8%"
          deltaUp={true}
          color="green"
        />
        <StatCard
          icon="videos"
          value="12 480"
          label="Vidéos stockées"
          sub="148 cette semaine"
          delta="-3%"
          deltaUp={false}
          color="amber"
        />
        <StatCard
          icon="3d"
          value="3 261"
          label="Fichiers 3D"
          sub="87 cette semaine"
          delta="+21%"
          deltaUp={true}
          color="purple"
        />
      </div>

      <div className="chart-card" style={{ marginBottom: "14px" }}>
        <div className="card-header">
          <span className="card-title">Stockage global</span>
          <span className="card-hint">Utilisé sur 2 TB alloués</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "22px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: "600", color: "var(--text)" }}>1.34 TB</span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)", alignSelf: "flex-end" }}>67% utilisé</span>
        </div>
        <div className="storage-bar">
          <div className="storage-fill" style={{ width: "67%" }}></div>
        </div>
        <div style={{ display: "flex", gap: "18px", marginTop: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Images <strong style={{ color: "var(--accent-blue)" }}>820 GB</strong></span>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Vidéos <strong style={{ color: "#F59E0B" }}>460 GB</strong></span>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>3D <strong style={{ color: "#A78BFA" }}>60 GB</strong></span>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Autres <strong style={{ color: "var(--text-muted)" }}>0 GB</strong></span>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <span className="card-title">Uploads par mois</span>
            <span className="card-hint">6 derniers mois</span>
          </div>
          <div className="chart-area">
            <div className="bar-chart">
              {["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"].map((month, i) => {
                const heights = [55, 72, 61, 88, 78, 95];
                const colors = i < 3 ? "blue-bar" : "green-bar";
                return (
                  <div key={month} className="bar-wrap">
                    <div className={`bar ${colors}`} style={{ height: `${heights[i]}%` }}></div>
                    <span className="bar-label">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <span className="card-title">Répartition assets</span>
          </div>
          <div className="donut-wrap">
            <svg className="donut-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(59,130,246,0.9)" strokeWidth="18" strokeDasharray="150 89" strokeDashoffset="25" strokeLinecap="round" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(245,158,11,0.85)" strokeWidth="18" strokeDasharray="62 177" strokeDashoffset="-125" strokeLinecap="round" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(139,92,246,0.85)" strokeWidth="18" strokeDasharray="27 212" strokeDashoffset="-187" strokeLinecap="round" />
              <text x="50" y="47" textAnchor="middle" fill="#E2E8F0" fontSize="12" fontFamily="Space Grotesk, sans-serif" fontWeight="600">200K</text>
              <text x="50" y="58" textAnchor="middle" fill="#9CA3AF" fontSize="7">assets</text>
            </svg>
            <div className="donut-legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: "#3B82F6" }}></span><span className="legend-label">Images</span><span className="legend-val">184K</span></div>
              <div className="legend-item"><span className="legend-dot" style={{ background: "#F59E0B" }}></span><span className="legend-label">Vidéos</span><span className="legend-val">12.4K</span></div>
              <div className="legend-item"><span className="legend-dot" style={{ background: "#8B5CF6" }}></span><span className="legend-label">Fichiers 3D</span><span className="legend-val">3.2K</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="activity-card">
        <div className="card-header">
          <span className="card-title">Activité récente</span>
          <span className="card-hint">Dernières 24h</span>
        </div>
        <div className="activity-list">
          <ActivityItem
            icon="upload"
            text={<><strong>Marie Laurent</strong> a uploadé 14 nouvelles images</>}
            time="Il y a 12 min"
            iconBg="rgba(16,185,129,0.15)"
            iconColor="var(--accent-green)"
          />
          <ActivityItem
            icon="user"
            text={<><strong>Thomas Remy</strong> a créé un nouveau compte</>}
            time="Il y a 34 min"
            iconBg="rgba(59,130,246,0.15)"
            iconColor="var(--accent-blue)"
          />
          <ActivityItem
            icon="delete"
            text={<><strong>Admin</strong> a supprimé 3 assets non conformes</>}
            time="Il y a 1h 20min"
            iconBg="rgba(239,68,68,0.15)"
            iconColor="var(--red)"
          />
          <ActivityItem
            icon="role"
            text={<><strong>Lucas Morel</strong> a changé de rôle : Graphiste → Développeur</>}
            time="Il y a 2h"
            iconBg="rgba(245,158,11,0.15)"
            iconColor="#F59E0B"
          />
        </div>
      </div>
    </>
  );
};

export default DashboardPanel;