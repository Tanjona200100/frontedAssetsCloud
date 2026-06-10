// components/AdminDashboard/AssetsPanel.jsx
import { useState, useEffect, useCallback, useRef } from "react";

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

const getFileTypeClass = (fileType) => {
  switch (fileType) {
    case "image": return "ftype-dot img";
    case "video": return "ftype-dot vid";
    case "3d_model": return "ftype-dot three";
    case "unity_package": return "ftype-dot unity";
    case "archive": return "ftype-dot archive";
    default: return "ftype-dot";
  }
};

const getFileTypeText = (fileType) => {
  switch (fileType) {
    case "image": return "IMG";
    case "video": return "VID";
    case "3d_model": return "3D";
    case "unity_package": return "UNITY";
    case "archive": return "ZIP";
    default: return "FILE";
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const ActionButtons = ({ asset, onView, onDelete, onDownload, isDeleting, isDownloading }) => (
  <div className="action-btns">
    <button className="a-btn" title="Voir" onClick={() => onView(asset)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
    <button className="a-btn" title="Télécharger" onClick={() => onDownload(asset)} disabled={isDownloading}>
      {isDownloading ? (
        <span style={{ fontSize: '10px' }}>...</span>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
    </button>
    <button className="a-btn del" title="Supprimer" onClick={() => onDelete(asset)} disabled={isDeleting}>
      {isDeleting ? (
        <span style={{ fontSize: '10px' }}>...</span>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3,6 5,6 21,6" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
      )}
    </button>
  </div>
);

const AssetsPanel = ({ searchQuery }) => {

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("Tous les types");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const isMounted = useRef(true);

  // Récupérer les assets
  const fetchAssets = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      // Construire l'URL avec les filtres
      let url = `/assets?page=${page}&limit=${pagination.limit}`;
      
      // Filtre par type
      if (filterType !== "Tous les types") {
        let fileType = '';
        switch (filterType) {
          case "Images": fileType = 'image'; break;
          case "Vidéos": fileType = 'video'; break;
          case "3D": fileType = '3d_model'; break;
          default: break;
        }
        if (fileType) url += `&file_type=${fileType}`;
      }
      
      // Filtre par recherche
      if (searchQuery && searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      console.log('Fetching assets from:', url);
      const data = await apiRequest(url);
      
        setAssets(data.assets || []);
        setPagination(data.pagination || {
          page: page,
          limit: 10,
          total: data.assets?.length || 0,
          pages: 1
        });
        setError(null);
    } catch (err) {
      console.error('Erreur chargement assets:', err);
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
        setLoading(false);
    }
  }, [filterType, searchQuery, pagination.limit]);

  // Supprimer un asset
  const handleDelete = async (asset) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${asset.title}" ?`)) {
      return;
    }
    
    try {
      setDeletingId(asset.id);
      await apiRequest(`/assets/${asset.id}`, { method: 'DELETE' });
      
      // Recharger la liste
      await fetchAssets(pagination.page);
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Télécharger un asset
  const handleDownload = async (asset) => {
    try {
      setDownloadingId(asset.id);
      const token = localStorage.getItem('token');
      
      console.log('Téléchargement:', asset.id);
      const response = await fetch(`${API_BASE_URL}/assets/${asset.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur téléchargement');
      }
      
      // Récupérer le blob et créer un lien de téléchargement
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.file_name || asset.title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      alert('Erreur lors du téléchargement: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // Voir l'asset
  const handleView = (asset) => {
    alert(`📁 ${asset.title}\n\n📄 Type: ${asset.file_type}\n📦 Taille: ${formatFileSize(asset.file_size)}\n👤 Propriétaire: ${asset.first_name || ''} ${asset.last_name || ''}\n🔒 Visibilité: ${asset.visibility}\n📅 Créé le: ${formatDate(asset.created_at)}`);
  };

  // Changer de page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchAssets(newPage);
    }
  };

  useEffect(() => {
    fetchAssets(1);
  }, [fetchAssets]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Générer les numéros de page
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.pages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (loading && assets.length === 0) {
    return (
      <div className="table-card">
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div>Chargement des assets...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-card">
        <div style={{ textAlign: 'center', padding: '60px', color: '#EF4444' }}>
          <div>Erreur: {error}</div>
          <button 
            onClick={() => fetchAssets(1)}
            style={{
              display: 'block',
              margin: '20px auto 0',
              padding: '8px 16px',
              background: '#3B82F6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-top">
        <span className="card-title" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px" }}>
          Gestion des Assets
        </span>
        <div className="table-actions">
          <select 
            className="btn-sm" 
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
            }}
            style={{ border: "1px solid var(--border)", background: "rgba(30,41,59,0.6)", color: "var(--text-muted)", borderRadius: "7px", fontSize: "12px", padding: "6px 10px", outline: "none", fontFamily: "inherit", cursor: "pointer" }}
          >
            <option>Tous les types</option>
            <option>Images</option>
            <option>Vidéos</option>
            <option>3D</option>
          </select>
        </div>
      </div>
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>Fichier</th>
            <th>Propriétaire</th>
            <th>Taille</th>
            <th>Upload</th>
            <th>Type</th>
            <th>Visibilité</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Aucun asset trouvé
              </td>
            </tr>
          ) : (
            assets.map(asset => (
              
              <tr key={asset.id}>
                <td style={{ fontWeight: "500", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={asset.title}>
                  {asset.title}
                </td>
                <td style={{ color: "var(--text-muted)" }}>
                  {asset.first_name} {asset.last_name}
                </td>
                <td style={{ color: "var(--text-muted)" }}>
                  {formatFileSize(asset.file_size)}
                </td>
                <td style={{ color: "var(--text-muted)" }}>
                  {formatDate(asset.created_at)}
                </td>
                <td>
                  <span className="ftype">
                    <span className={getFileTypeClass(asset.file_type)}>
                      {getFileTypeText(asset.file_type)}
                    </span>
                    {asset.file_type === 'image' ? 'IMG' : 
                     asset.file_type === 'video' ? 'VID' :
                     asset.file_type === '3d_model' ? '3D' :
                     asset.file_type === 'unity_package' ? 'UNITY' : 'FILE'}
                  </span>
                </td>
                <td>
                  <span className={`visibility-badge ${asset.visibility}`}>
                    {asset.visibility === 'public' ? 'Public' : 
                     asset.visibility === 'team' ? 'Team' : 'Privé'}
                  </span>
                </td>
                <td>
                  <ActionButtons 
                    asset={asset}
                    onView={handleView}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    isDeleting={deletingId === asset.id}
                    isDownloading={downloadingId === asset.id}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {pagination.pages > 1 && (
        <div className="pag">
          <span className="pag-info">
            Affichage {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total.toLocaleString()} assets
          </span>
          <div className="pag-btns">
            <button 
              className="pag-btn" 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            
            {getPageNumbers().map(page => (
              <button 
                key={page}
                className={`pag-btn ${pagination.page === page ? 'cur' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            
            {pagination.pages > 5 && pagination.page < pagination.pages - 2 && (
              <button className="pag-btn" disabled>…</button>
            )}
            
            <button 
              className="pag-btn" 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPanel;