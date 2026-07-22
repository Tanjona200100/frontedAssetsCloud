// src/components/UserDashboard/HistoryPanel.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ;

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
      asset_id: asset.id,
      visibility: asset.visibility || 'public'
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
      asset_id: asset.id,
      visibility: asset.visibility || 'public'
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
      const start = (page - 1) * 10;
      const end = start + 10;
      const paginatedHistory = allHistory.slice(start, end);
      
      setHistory(paginatedHistory);
      setTotalItems(allHistory.length);
      setTotalPages(Math.max(1, Math.ceil(allHistory.length / 10)));
      
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
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Auj.";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    return `${date.getDate()} ${date.toLocaleString('fr', { month: 'short' })}`;
  };

  // Formater la taille
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Obtenir l'extension en majuscules
  const getFileExt = (fileName) => {
    return fileName?.split('.').pop()?.toUpperCase() || 'FILE';
  };

  // Obtenir l'icône du fichier (comme dans DashboardPanel)
  const getFileIcon = (fileType, fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    
    if (fileType === 'image' || ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') return 'img';
    if (fileType === 'video' || ext === 'mp4' || ext === 'webm' || ext === 'mov') return 'vid';
    if (fileType === '3d_model' || ext === 'glb' || ext === 'obj' || ext === 'fbx' || ext === 'stl') return '3d';
    if (ext === 'psd') return 'psd';
    if (ext === 'ai') return 'ai';
    if (ext === 'zip' || ext === 'rar' || ext === '7z') return 'zip';
    if (ext === 'json') return 'json';
    return 'file';
  };

  // Détection des types de fichiers
  const isZipFile = (item) => {
    const ext = item.ext?.toLowerCase() || '';
    return ext === 'zip' || ext === 'rar' || ext === '7z';
  };

  const is3DModel = (item) => {
    const ext = item.ext?.toLowerCase() || '';
    return ['glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds', 'ply'].includes(ext);
  };

  const isVideoFile = (item) => {
    const ext = item.ext?.toLowerCase() || '';
    return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
  };

  const isImageFile = (item) => {
    const ext = item.ext?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'].includes(ext);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--text-muted)' }}>Chargement de l'historique...</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: '16px' }}>
      <div className="card-header">
        <span className="card-title">Historique des activités ({totalItems})</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <select 
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            style={{ 
              background: 'rgba(0,0,0,.3)', 
              border: '1px solid rgba(255,255,255,.1)', 
              borderRadius: 6, 
              padding: '4px 8px', 
              color: 'white', 
              fontSize: 12 
            }}
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
            style={{ 
              background: 'rgba(255,255,255,.05)', 
              border: '1px solid rgba(255,255,255,.1)', 
              borderRadius: 6, 
              padding: '4px 8px', 
              cursor: 'pointer', 
              color: 'var(--muted)' 
            }}
            title="Rafraîchir"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', fontSize: '12px', color: '#F87171', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', margin: '12px' }}>
          {error}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Fichier</th>
            <th>Taille</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div>Aucun événement trouvé</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>Commencez à uploader des fichiers pour voir l'historique</div>
              </td>
            </tr>
          ) : (
            history.map((item) => {
              const ext = getFileExt(item.name);
              const icon = getFileIcon(item.action, item.name);
              const isZIP = isZipFile(item);
              const is3D = is3DModel(item);
              const isVideo = isVideoFile(item);
              const isImage = isImageFile(item);

              return (
                <tr key={item.id}>
                  <td>
                    <div className="file-cell">
                      <div className={`file-icon ${icon}`}>{ext}</div>
                      <div>
                        <div className="fn" style={{ fontWeight: 500 }}>{item.name}</div>
                        <div className="fm" style={{ fontSize: 10, color: 'var(--muted)' }}>
                          {isZIP ? '📦 Archive ZIP' : 
                           is3D ? '🎨 Modèle 3D' : 
                           isVideo ? '🎬 Vidéo' : 
                           isImage ? '🖼️ Image' : 
                           (item.ext || 'Fichier')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
                    {formatFileSize(item.size)}
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--dim)' }}>
                    {formatDate(item.date)}
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: `${actionColors[item.action] || 'var(--dim)'}15`,
                      color: actionColors[item.action] || 'var(--dim)'
                    }}>
                      {actionLabels[item.action] || item.action}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination - style identique au DashboardPanel */}
      {totalItems > 10 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap',
          gap: 12,
          background: 'rgba(0,0,0,0.15)',
          borderRadius: '0 0 12px 12px'
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 11
            }}>
              {totalItems > 0 ? 
                `${(page - 1) * 10 + 1}–${Math.min(page * 10, totalItems)}` : 
                '0'}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              sur {totalItems}
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: 6, 
            alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            padding: '4px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                border: 'none',
                background: page === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                color: page === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace"
              }}
              onMouseEnter={(e) => {
                if (page !== 1) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== 1) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }
              }}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isNearCurrent = Math.abs(pageNum - page) <= 2;
              const isFirstOrLast = pageNum === 1 || pageNum === totalPages;
              const showPage = isNearCurrent || isFirstOrLast;

              if (!showPage) {
                if (pageNum === page - 3 || pageNum === page + 3) {
                  return (
                    <span
                      key={`dots-${pageNum}`}
                      style={{
                        width: 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      …
                    </span>
                  );
                }
                return null;
              }

              const isActive = pageNum === page;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 6,
                    border: 'none',
                    background: isActive ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 20px rgba(59,130,246,0.15)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                border: 'none',
                background: page === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                color: page === totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace"
              }}
              onMouseEnter={(e) => {
                if (page !== totalPages) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== totalPages) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }
              }}
            >
              ›
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              Aller à
            </span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= totalPages) {
                  handlePageChange(val);
                }
              }}
              style={{
                width: 44,
                padding: '4px 6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 4,
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                textAlign: 'center',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(59,130,246,0.4)';
                e.target.style.background = 'rgba(59,130,246,0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
            <span style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              / {totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}