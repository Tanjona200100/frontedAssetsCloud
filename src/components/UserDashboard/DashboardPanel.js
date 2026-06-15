// src/components/UserDashboard/DashboardPanel.jsx
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserContext } from '../../pages/UserDashboard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Une erreur est survenue');
  }
  return data;
};

// Formater la taille des fichiers
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
};

// Formater la date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return "Auj.";
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return `${date.getDate()} ${date.toLocaleString('fr', { month: 'short' })}`;
};

// Obtenir l'icône en fonction du type de fichier
const getFileIcon = (fileType, fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  
  if (fileType === 'image' || ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') return 'img';
  if (fileType === 'video' || ext === 'mp4' || ext === 'webm') return 'vid';
  if (fileType === '3d_model' || ext === 'glb' || ext === 'obj' || ext === 'fbx') return '3d';
  if (ext === 'psd') return 'psd';
  if (ext === 'ai') return 'ai';
  if (ext === 'zip') return 'zip';
  if (ext === 'json') return 'json';
  return 'file';
};

// Obtenir l'extension en majuscules
const getFileExt = (fileName) => {
  return fileName?.split('.').pop()?.toUpperCase() || 'FILE';
};

export default function DashboardPanel() {
  const { role, config, openPreview } = useContext(UserContext);
  const [dashboardData, setDashboardData] = useState({
    userAssets: [],           // Tous les assets de l'utilisateur
    totalAssets: 0,           // Nombre total d'assets de l'utilisateur
    weeklyUploads: 0,         // Uploads de la semaine
    usedStorage: 0,           // Stockage utilisé en GB
    recentUploads: [],        // 4 derniers uploads
    loading: true,
    error: null
  });

  const isGfx = role === 'gfx';
  const userRole = isGfx ? 'graphiste' : 'developpeur';

  // Limite de stockage (50 GB)
  const storageLimit = 50;
  const storagePercent = Math.min(Math.round((dashboardData.usedStorage / storageLimit) * 100), 100);
  const dashArr = `${Math.round(storagePercent / 100 * 176)} ${Math.round((1 - storagePercent / 100) * 176)}`;
  const freeStorage = Math.max(0, storageLimit - dashboardData.usedStorage);

  // Récupérer les assets de l'utilisateur connecté
  const fetchUserAssets = useCallback(async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      // Récupérer les informations de l'utilisateur connecté
      const userProfile = await apiRequest('/auth/profile');
      const currentUserId = userProfile.user?.id;
      
      if (!currentUserId) {
        throw new Error('ID utilisateur non trouvé');
      }

      // Récupérer UNIQUEMENT les assets de cet utilisateur
      const assetsData = await apiRequest(`/assets?uploaded_by=${currentUserId}&limit=50`);
      
      const userAssetsList = assetsData.assets || [];
      
      // Calculer les uploads de la semaine
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyUploadsCount = userAssetsList.filter(asset => 
        new Date(asset.created_at) >= oneWeekAgo
      ).length;
      
      // Calculer le stockage utilisé (en GB)
      const usedStorageBytes = userAssetsList.reduce((sum, asset) => sum + (asset.file_size || 0), 0);
      const usedStorageGB = usedStorageBytes / (1024 * 1024 * 1024);
      
      // Les 4 derniers uploads
      const recentUploadsList = [...userAssetsList]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4)
        .map(asset => ({
          id: asset.id,
          name: asset.title,
          ext: getFileExt(asset.file_name || asset.title),
          icon: getFileIcon(asset.file_type, asset.file_name || asset.title),
          size: formatFileSize(asset.file_size),
          date: formatDate(asset.created_at),
          originalName: asset.file_name,
          fileType: asset.file_type,
          fileUrl: asset.file_url
        }));
      
      setDashboardData({
        userAssets: userAssetsList,
        totalAssets: userAssetsList.length,
        weeklyUploads: weeklyUploadsCount,
        usedStorage: parseFloat(usedStorageGB.toFixed(1)),
        recentUploads: recentUploadsList,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  useEffect(() => {
    fetchUserAssets();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchUserAssets, 30000);
    return () => clearInterval(interval);
  }, [fetchUserAssets]);

  // Données par défaut pour l'erreur ou le chargement
  const defaultFiles = isGfx ? [
    { ext: 'PSD', icon: 'psd', name: 'brand_identity_v4.psd', size: '142 MB', date: 'Auj.' },
    { ext: 'PNG', icon: 'img', name: 'hero_illustration.png', size: '4.8 MB', date: 'Hier' },
    { ext: 'AI', icon: 'ai', name: 'logo_variants.ai', size: '8.2 MB', date: '25 mai' },
    { ext: 'GLB', icon: '3d', name: 'product_model.glb', size: '22 MB', date: '24 mai' },
  ] : [
    { ext: 'ZIP', icon: 'zip', name: 'api_assets_v2.zip', size: '48 MB', date: 'Auj.' },
    { ext: 'JSON', icon: 'json', name: 'config_prod.json', size: '12 KB', date: 'Hier' },
    { ext: 'PNG', icon: 'img', name: 'ui_mockups_v3.png', size: '2.1 MB', date: '25 mai' },
    { ext: 'MP4', icon: 'vid', name: 'demo_walkthrough.mp4', size: '186 MB', date: '24 mai' },
  ];

  const displayFiles = dashboardData.error ? defaultFiles : 
    (dashboardData.recentUploads.length > 0 ? dashboardData.recentUploads : defaultFiles);

  // Calculer la variation par rapport au mois dernier (simulé pour l'instant)
  const getVariation = (current) => {
    if (current === 0) return '+0%';
    // Variation simulée basée sur les données réelles
    if (current > 100) return '+14%';
    if (current > 50) return '+8%';
    if (current > 10) return '+5%';
    return '+2%';
  };

  if (dashboardData.loading && !dashboardData.userAssets.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--text-muted)' }}>Chargement de votre tableau de bord...</div>
      </div>
    );
  }

  return (
    <>
      <div className="kpi-row">
        <div className="kpi-card" style={{ '--kglow': `${config.accent}22` }}>
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: `${config.accent}22`, color: config.accent }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
            <span className="kpi-tag up">{getVariation(dashboardData.totalAssets)}</span>
          </div>
          <div className="kpi-value">{dashboardData.totalAssets.toLocaleString()}</div>
          <div className="kpi-label">Mes assets</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'rgba(245,158,11,.15)', color: '#F59E0B' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className="kpi-tag up">+{dashboardData.weeklyUploads > 0 ? Math.min(15, dashboardData.weeklyUploads * 2) : 0}%</span>
          </div>
          <div className="kpi-value">{dashboardData.weeklyUploads}</div>
          <div className="kpi-label">Uploads / semaine</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'rgba(139,92,246,.15)', color: '#8B5CF6' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 2,7 12,12 22,7" />
                <polyline points="2,17 12,22 22,17" />
                <polyline points="2,12 12,17 22,12" />
              </svg>
            </div>
            <span className="kpi-tag up">+3</span>
          </div>
          <div className="kpi-value">{isGfx ? Math.min(20, Math.floor(dashboardData.totalAssets / 10)) : Math.min(15, Math.floor(dashboardData.totalAssets / 8))}</div>
          <div className="kpi-label">{isGfx ? 'Collections' : 'Projets actifs'}</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'rgba(239,68,68,.12)', color: '#EF4444' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <span className={`kpi-tag ${storagePercent > 50 ? 'dn' : 'up'}`}>{storagePercent}%</span>
          </div>
          <div className="kpi-value">{dashboardData.usedStorage.toFixed(1)}</div>
          <div className="kpi-label">GB utilisés</div>
        </div>
      </div>

      <div className="cols2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mes derniers uploads</span>
            <button className="btn btn-sm" onClick={() => window.location.href = '/user/assets'}>
              Voir tout ({dashboardData.totalAssets})
            </button>
          </div>
          {dashboardData.error && (
            <div style={{ padding: '12px', fontSize: '12px', color: '#F87171', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', margin: '12px' }}>
               {dashboardData.error} - Affichage des données de démonstration
            </div>
          )}
          <table className="data-table">
            <thead>
              <tr>
                <th>Fichier</th><th>Taille</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {displayFiles.map((f, i) => (
                <tr key={f.id || i}>
                  <td>
                    <div className="file-cell">
                      <div className={`file-icon ${f.icon}`}>{f.ext}</div>
                      <div>
                        <div className="fn" style={{ fontWeight: 500 }}>{f.name}</div>
                        <div className="fm" style={{ fontSize: 10, color: 'var(--muted)' }}>{config.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>{f.size}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--dim)' }}>{f.date}</td>
                  <td>
                    <div className="action-group">
                      <button className="action-btn" onClick={() => openPreview(f.name)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="action-btn" onClick={() => {
                        if (f.fileUrl) {
                          window.open(f.fileUrl, '_blank');
                        }
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7,10 12,15 17,10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dashboardData.totalAssets === 0 && !dashboardData.error && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Vous n'avez pas encore uploadé d'assets.
              <button 
                onClick={() => window.location.href = '/user/assets/upload'}
                style={{ display: 'block', margin: '16px auto 0', padding: '8px 16px', background: config.accent, border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
              >
                Uploader un asset
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Mon stockage</span>
          </div>
          <div className="ring-box" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
            <div className="ring" style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              <svg viewBox="0 0 72 72" width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="8" />
                <circle cx="36" cy="36" r="28" fill="none" stroke={config.accent} strokeWidth="8"
                  strokeDasharray={dashArr} strokeLinecap="round" />
              </svg>
              <div className="ring-c" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="ring-pct" style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800 }}>{storagePercent}%</div>
                <div className="ring-lbl" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--dim)' }}>utilisé</div>
              </div>
            </div>
            <div className="ring-details" style={{ flex: 1 }}>
              <div className="rd-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span className="rd-lbl" style={{ color: 'var(--muted)' }}>Utilisé</span>
                <span className="rd-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 500 }}>{dashboardData.usedStorage.toFixed(1)} GB</span>
              </div>
              <div className="rd-bar" style={{ height: 3, background: 'rgba(255,255,255,.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div className="rd-fill" style={{ width: `${storagePercent}%`, height: '100%', borderRadius: 2, background: config.accent }} />
              </div>
              <div className="rd-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span className="rd-lbl" style={{ color: 'var(--muted)' }}>Libre</span>
                <span className="rd-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 500 }}>{freeStorage.toFixed(1)} GB</span>
              </div>
              <div className="rd-bar" style={{ height: 3, background: 'rgba(255,255,255,.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div className="rd-fill" style={{ width: `${100 - storagePercent}%`, height: '100%', borderRadius: 2, background: 'rgba(255,255,255,.08)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}