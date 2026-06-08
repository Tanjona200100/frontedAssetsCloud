import { useState, useEffect } from 'react';


const API_BASE = 'http://localhost:5000/api';

// Récupérer le token
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

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
  const [stats, setStats] = useState({
    totals: { users: {}, assets: {} },
    validation_rates: []
  });
  const [activities, setActivities] = useState([]);
  const [monthlyUploads, setMonthlyUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        setError('Non authentifié');
        setLoading(false);
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Récupérer les stats
      const statsRes = await fetch(`${API_BASE}/admin/stats`, { headers });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // 2. Récupérer les activités récentes
      const activitiesRes = await fetch(`${API_BASE}/admin/activities/recent?limit=5`, { headers });
      const activitiesData = await activitiesRes.json();
      if (activitiesData.success) setActivities(activitiesData.activities);

      // 3. Récupérer les uploads mensuels
      const monthlyRes = await fetch(`${API_BASE}/admin/stats/uploads-per-month`, { headers });
      const monthlyData = await monthlyRes.json();
      if (monthlyData.success) setMonthlyUploads(monthlyData.data);

    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Formater la taille
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalUsers = stats.totals?.users?.total || 0;
  const totalImages = stats.totals?.assets?.images || 0;
  const totalVideos = stats.totals?.assets?.videos || 0;
  const total3D = stats.totals?.assets?.models_3d || 0;
  const totalSize = stats.totals?.assets?.total_size || 0;
  const storagePercentage = (totalSize / (2 * 1024 * 1024 * 1024 * 1024)) * 100;

  return (
    <>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: '12px', padding: '12px', marginBottom: '20px', color: '#EF4444' }}>
          Erreur: {error}
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          icon="users"
          value={loading ? "---" : totalUsers.toLocaleString()}
          label="Utilisateurs totaux"
          sub={`${stats.totals?.users?.graphistes || 0} graphistes, ${stats.totals?.users?.developpeurs || 0} développeurs`}
          color="blue"
          isLoading={loading}
        />
        <StatCard
          icon="images"
          value={loading ? "---" : totalImages.toLocaleString()}
          label="Images stockées"
          sub={`${totalImages} fichiers`}
          color="green"
          isLoading={loading}
        />
        <StatCard
          icon="videos"
          value={loading ? "---" : totalVideos.toLocaleString()}
          label="Vidéos stockées"
          sub={`${totalVideos} fichiers`}
          color="amber"
          isLoading={loading}
        />
        <StatCard
          icon="3d"
          value={loading ? "---" : total3D.toLocaleString()}
          label="Fichiers 3D"
          sub={`${total3D} modèles`}
          color="purple"
          isLoading={loading}
        />
      </div>

      <div className="chart-card" style={{ marginBottom: "14px" }}>
        <div className="card-header">
          <span className="card-title">Stockage global</span>
          <span className="card-hint">Utilisé sur 2 TB alloués</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "22px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: "600", color: "var(--text)" }}>
            {loading ? "---" : formatBytes(totalSize)}
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)", alignSelf: "flex-end" }}>
            {Math.round(storagePercentage)}% utilisé
          </span>
        </div>
        <div className="storage-bar">
          <div className="storage-fill" style={{ width: `${Math.min(storagePercentage, 100)}%` }}></div>
        </div>
      </div>

      {/* Graphique des uploads mensuels */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <span className="card-title">Uploads par mois</span>
            <span className="card-hint">6 derniers mois</span>
          </div>
          <div className="chart-area">
            <div className="bar-chart">
              {monthlyUploads.map((item, i) => {
                const maxCount = Math.max(...monthlyUploads.map(m => m.count), 1);
                const heightPercent = (item.count / maxCount) * 100;
                return (
                  <div key={item.month} className="bar-wrap">
                    <div className="bar blue-bar" style={{ height: `${Math.max(heightPercent, 5)}%` }}></div>
                    <span className="bar-label">{item.month}</span>
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
              {!loading && (() => {
                const total = stats.totals?.assets?.total || 0;
                const images = stats.totals?.assets?.images || 0;
                const videos = stats.totals?.assets?.videos || 0;
                const models3d = stats.totals?.assets?.models_3d || 0;

                if (total === 0) {
                  return (
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(100,116,139,0.3)" strokeWidth="18" strokeDasharray="239" strokeLinecap="round" />
                  );
                }

                // Circonférence = 2 * π * r = 2 * 3.14159 * 38 ≈ 238.76
                const circumference = 239;

                // Calculer les proportions
                const imagesPercent = images / total;
                const videosPercent = videos / total;
                const modelsPercent = models3d / total;

                // Calculer les dasharrays et offsets
                const imagesDash = imagesPercent * circumference;
                const videosDash = videosPercent * circumference;
                const modelsDash = modelsPercent * circumference;

                // Calculer les offsets
                const imagesOffset = 25;
                const videosOffset = imagesOffset - imagesDash;
                const modelsOffset = videosOffset - videosDash;

                return (
                  <>
                    {/* Images - Bleu */}
                    {images > 0 && (
                      <circle
                        cx="50" cy="50" r="38"
                        fill="none"
                        stroke="rgba(59,130,246,0.9)"
                        strokeWidth="18"
                        strokeDasharray={`${imagesDash} ${circumference}`}
                        strokeDashoffset={imagesOffset}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Vidéos - Orange */}
                    {videos > 0 && (
                      <circle
                        cx="50" cy="50" r="38"
                        fill="none"
                        stroke="rgba(245,158,11,0.85)"
                        strokeWidth="18"
                        strokeDasharray={`${videosDash} ${circumference}`}
                        strokeDashoffset={videosOffset}
                        strokeLinecap="round"
                      />
                    )}
                    {/* 3D Models - Violet */}
                    {models3d > 0 && (
                      <circle
                        cx="50" cy="50" r="38"
                        fill="none"
                        stroke="rgba(139,92,246,0.85)"
                        strokeWidth="18"
                        strokeDasharray={`${modelsDash} ${circumference}`}
                        strokeDashoffset={modelsOffset}
                        strokeLinecap="round"
                      />
                    )}
                  </>
                );
              })()}
              <text x="50" y="47" textAnchor="middle" fill="#E2E8F0" fontSize="12" fontFamily="Space Grotesk, sans-serif" fontWeight="600">
                {loading ? "---" : (stats.totals?.assets?.total || 0).toLocaleString()}
              </text>
              <text x="50" y="58" textAnchor="middle" fill="#9CA3AF" fontSize="7">assets</text>
            </svg>
            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "#3B82F6" }}></span>
                <span className="legend-label">Images</span>
                <span className="legend-val">{loading ? "---" : (stats.totals?.assets?.images || 0).toLocaleString()}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "#F59E0B" }}></span>
                <span className="legend-label">Vidéos</span>
                <span className="legend-val">{loading ? "---" : (stats.totals?.assets?.videos || 0).toLocaleString()}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "#8B5CF6" }}></span>
                <span className="legend-label">Fichiers 3D</span>
                <span className="legend-val">{loading ? "---" : (stats.totals?.assets?.models_3d || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="activity-card">
        <div className="card-header">
          <span className="card-title">Activité récente</span>
        </div>
        <div className="activity-list">
          {activities.map((activity, idx) => {
            let icon = "upload", iconBg = "rgba(16,185,129,0.15)", iconColor = "var(--accent-green)";
            switch (activity.action) {
              case 'upload': icon = "upload"; break;
              case 'download': icon = "user"; iconBg = "rgba(59,130,246,0.15)"; iconColor = "var(--accent-blue)"; break;
              case 'delete': icon = "delete"; iconBg = "rgba(239,68,68,0.15)"; iconColor = "var(--red)"; break;
              default: break;
            }
            const time = new Date(activity.created_at).toLocaleString('fr-FR');
            return (
              <ActivityItem
                key={idx}
                icon={icon}
                text={<><strong>{activity.user_name || 'Utilisateur'}</strong> {activity.description || activity.action}</>}
                time={time}
                iconBg={iconBg}
                iconColor={iconColor}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default DashboardPanel;