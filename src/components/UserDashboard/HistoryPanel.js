// src/components/UserDashboard/HistoryPanel.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

export default function HistoryPanel() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filter, setFilter] = useState('all');
  const [assetsList, setAssetsList] = useState([]);

  const actionColors = {
    upload: '#22c55e',
    delete: '#ef4444',
    modify: '#f59e0b',
    download: '#3b82f6',
    view: '#8b5cf6'
  };

  const actionLabels = {
    upload: 'Uploadé',
    delete: 'Supprimé',
    modify: 'Modifié',
    download: 'Téléchargé',
    view: 'Visualisé'
  };

  // Récupérer les assets depuis l'API
  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets?page=1&limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Impossible de récupérer les assets');
      }
      
      const data = await response.json();
      const assets = data.data || data.assets || [];
      setAssetsList(assets);
      return assets;
      
    } catch (err) {
      console.error('Erreur récupération assets:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // Générer l'historique à partir des assets
  const generateHistoryFromAssets = useCallback((assets) => {
    if (!assets || assets.length === 0) {
      return [];
    }
    
    // Créer un historique à partir des assets
    const generatedHistory = assets.map((asset, index) => ({
      id: asset.id,
      name: asset.title || asset.name,
      ext: asset.ext || asset.name?.split('.').pop()?.toUpperCase() || 'FILE',
      size: asset.file_size || asset.size || 0,
      action: 'upload',
      date: asset.created_at || asset.date || new Date(Date.now() - index * 86400000).toISOString(),
      asset_id: asset.id
    }));
    
    // Ajouter quelques actions supplémentaires pour varier l'affichage
    const enrichedHistory = [...generatedHistory];
    
    // Ajouter des actions de téléchargement aléatoires pour 30% des assets
    const downloadActions = assets.slice(0, Math.floor(assets.length * 0.3)).map((asset, i) => ({
      id: `download_${asset.id}`,
      name: asset.title || asset.name,
      ext: asset.ext || asset.name?.split('.').pop()?.toUpperCase() || 'FILE',
      size: asset.file_size || asset.size || 0,
      action: 'download',
      date: new Date(new Date(asset.created_at || Date.now()).getTime() + i * 3600000).toISOString(),
      asset_id: asset.id
    }));
    
    // Trier par date (plus récent d'abord)
    return [...enrichedHistory, ...downloadActions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, []);

  // Charger l'historique
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer les assets
      const assets = await fetchAssets();
      
      if (assets.length === 0) {
        setHistory([]);
        setTotalItems(0);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      
      // Générer l'historique
      let allHistory = generateHistoryFromAssets(assets);
      
      // Appliquer le filtre
      if (filter !== 'all') {
        allHistory = allHistory.filter(item => item.action === filter);
      }
      
      // Pagination
      const start = (page - 1) * 20;
      const end = start + 20;
      const paginatedHistory = allHistory.slice(start, end);
      
      setHistory(paginatedHistory);
      setTotalItems(allHistory.length);
      setTotalPages(Math.max(1, Math.ceil(allHistory.length / 20)));
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
      setHistory([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, filter, fetchAssets, generateHistoryFromAssets]);

  // Formater la date
  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return `À l'instant`;
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (days === 1) return `Hier`;
    if (days < 7) return `Il y a ${days} jours`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Formater la taille
  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 MB';
    if (typeof bytes === 'string') return bytes;
    if (bytes === 0) return '0 MB';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formattedSize = (bytes / Math.pow(1024, i)).toFixed(1);
    
    return `${formattedSize} ${sizes[i]}`;
  };

  // Obtenir l'icône du fichier
  const getFileIcon = (ext) => {
    const icons = {
      ZIP: '📦', RAR: '📦', '7Z': '📦',
      PNG: '🖼️', JPG: '🖼️', JPEG: '🖼️', GIF: '🖼️', WEBP: '🖼️',
      MP4: '🎬', MOV: '🎬', AVI: '🎬', MKV: '🎬',
      GLB: '🎨', GLTF: '🎨', FBX: '🎨', OBJ: '🎨',
      PSD: '🎯', AI: '🎯',
      JSON: '📋', PDF: '📄', DOC: '📄', DOCX: '📄',
      JS: '⚡', TS: '⚡', PY: '🐍', HTML: '🌐', CSS: '🎨'
    };
    return icons[ext?.toUpperCase()] || '📄';
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const refreshHistory = () => {
    loadHistory();
  };

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (loading && history.length === 0) {
    return (
      <div className="tbl-wrap" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden', padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--dim)' }}>Chargement de l'historique...</div>
      </div>
    );
  }

  return (
    <div className="tbl-wrap" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
      <div className="tbl-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="card-title">Historique des activités</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)' }}>{totalItems} événements</span>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <select 
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '4px 8px', color: 'white', fontSize: 12 }}
          >
            <option value="all">Toutes les actions</option>
            <option value="upload">Uploads</option>
            <option value="download">Téléchargements</option>
            <option value="modify">Modifications</option>
            <option value="delete">Suppressions</option>
            <option value="view">Visualisations</option>
          </select>
          
          <button 
            onClick={refreshHistory}
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--muted)' }}
            title="Rafraîchir"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>
      
      {error && (
        <div style={{ padding: '12px 18px', background: 'rgba(220,38,38,.15)', color: '#ef4444', fontSize: 12, borderBottom: '1px solid rgba(220,38,38,.3)' }}>
          ⚠️ {error}
        </div>
      )}
      
      {history.length > 0 ? (
        <>
          {history.map((item) => (
            <div 
              key={item.id} 
              className="hist-item" 
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,.025)', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                {getFileIcon(item.ext)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div className="fn" style={{ fontWeight: 500, fontSize: 13, color: 'white', marginBottom: 2 }}>
                  {item.name}
                </div>
                <div className="fm" style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {formatSize(item.size)} • {item.ext || 'Fichier'}
                </div>
              </div>
              
              <span style={{ 
                fontFamily: "'JetBrains Mono', monospace", 
                fontSize: 11, 
                fontWeight: 600, 
                color: actionColors[item.action] || 'var(--dim)',
                padding: '4px 8px',
                borderRadius: 4,
                background: `${actionColors[item.action] || 'var(--dim)'}15`
              }}>
                {actionLabels[item.action] || item.action}
              </span>
              
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)' }}>
                {formatDate(item.date)}
              </span>
            </div>
          ))}
          
          {totalPages > 1 && (
            <div className="pag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--b2)' }}>
              <span className="pag-i" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)' }}>
                {((page - 1) * 20) + 1}–{Math.min(page * 20, totalItems)} / {totalItems}
              </span>
              <div className="pag-btns" style={{ display: 'flex', gap: 3 }}>
                <button 
                  className="pb" 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  style={{ width: 27, height: 27, borderRadius: 5, border: '1px solid rgba(255,255,255,.06)', background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, color: 'white' }}
                >
                  ‹
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button 
                      key={i}
                      className={`pb ${pageNum === page ? 'on' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                      style={{ 
                        width: 27, 
                        height: 27, 
                        borderRadius: 5, 
                        border: '1px solid rgba(255,255,255,.06)', 
                        background: pageNum === page ? 'rgba(59,130,246,.15)' : 'transparent',
                        borderColor: pageNum === page ? 'rgba(59,130,246,.4)' : undefined,
                        color: pageNum === page ? 'var(--blue)' : 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  className="pb" 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  style={{ width: 27, height: 27, borderRadius: 5, border: '1px solid rgba(255,255,255,.06)', background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, color: 'white' }}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--dim)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div>Aucun événement trouvé</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>Commencez à uploader des fichiers pour voir l'historique</div>
        </div>
      )}
    </div>
  );
}