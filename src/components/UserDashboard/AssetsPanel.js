// src/components/UserDashboard/AssetsPanel.jsx
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserContext } from '../../pages/UserDashboard';
import ModelViewer from './ModelViewer';

// Configuration API depuis les variables d'environnement
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

// Fonction pour décoder le token JWT et obtenir le user_id
const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.user_id || payload.sub || payload.id || null;
    return userId;
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
};

// Fonction pour valider un UUID
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export default function AssetsPanel() {
  const { role, config, openPreview } = useContext(UserContext);
  const isGfx = role === 'gfx';
  
  // États pour la gestion des données
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour la pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    visibility: 'private',
    file_type: '',
    search: '',
    categories: '',
    tags: ''
  });
  
  // État pour l'upload multiple
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // États pour les métadonnées d'upload
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadCategories, setUploadCategories] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  
  // État pour le modal de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  
  // État pour la vue 3D
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  
  // Vérifier l'authentification au chargement
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (!userId) {
      setError('Utilisateur non authentifié - Veuillez vous reconnecter');
    } else if (!isValidUUID(userId)) {
      console.warn('Invalid user_id format:', userId);
    }
  }, []);
  
  // Mapping extension -> file_type pour l'API
  const getFileTypeFromExt = (extension) => {
    const typeMap = {
      'PNG': 'image', 'JPG': 'image', 'JPEG': 'image', 'GIF': 'image', 'WEBP': 'image',
      'MP4': 'video', 'MOV': 'video', 'AVI': 'video', 'MKV': 'video',
      'GLB': '3d_model', 'GLTF': '3d_model', 'FBX': '3d_model', 'OBJ': '3d_model',
      'ZIP': 'archive', 'RAR': 'archive', '7Z': 'archive',
      'PSD': 'document', 'AI': 'document', 'JSON': 'document', 'PDF': 'document',
      'DOC': 'document', 'DOCX': 'document'
    };
    return typeMap[extension.toUpperCase()] || 'document';
  };
  
  // Vérifier si c'est un modèle 3D
const is3DModel = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, ''); // Nettoyer le point
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  
  // Formats 3D supportés
  const supported3DFormats = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds'];
  
  const is3DExtension = supported3DFormats.includes(ext);
  const is3DFileType = fileType === '3d_model';
  const is3DName = supported3DFormats.some(format => name?.endsWith(`.${format}`));
  
  console.log(`Asset ${asset.id} - is3D:`, { is3DExtension, is3DFileType, is3DName, ext });
  
  return is3DExtension || is3DFileType || is3DName;
};
  
  // Récupération des assets
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);
      params.append('visibility', filters.visibility);
      if (filters.file_type) params.append('file_type', filters.file_type);
      if (filters.search) params.append('search', filters.search);
      if (filters.categories) params.append('categories', filters.categories);
      if (filters.tags) params.append('tags', filters.tags);
      
      const url = `${API_BASE_URL}/assets?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non autorisé - Veuillez vous reconnecter');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      const assetsData = data.data || data.assets || [];
      
      setAssets(assetsData);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
      setTotalAssets(data.pagination?.total || data.total || assetsData.length);
      
    } catch (err) {
      console.error('Erreur lors du chargement des assets:', err);
      setError(err.message);
      setAssets([]);
      setTotalPages(1);
      setTotalAssets(0);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);
  
  // Upload multiple d'assets
  const handleMultipleUpload = async (event) => {
    event.preventDefault();
    
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }
    
    if (selectedFiles.length > 10) {
      setError('Maximum 10 fichiers par upload');
      return;
    }
    
    const oversizedFiles = selectedFiles.filter(f => f.size > 500 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} fichier(s) dépassent la limite de 500 MB`);
      return;
    }
    
    setUploading(true);
    setError(null);
    setUploadProgress({});
    
    try {
      const formData = new FormData();
      
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      if (uploadVisibility) formData.append('visibility', uploadVisibility);
      if (uploadCategories) formData.append('categories', uploadCategories);
      if (uploadTags) formData.append('tags', uploadTags);
      if (uploadTitle) formData.append('default_title', uploadTitle);
      if (uploadDescription) formData.append('default_description', uploadDescription);
      
      const url = `${API_BASE_URL}/assets/upload-multiple`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload échoué (${response.status}): ${errorText}`);
      }
      
      resetUploadForm();
      setShowUploadModal(false);
      await fetchAssets();
      
    } catch (err) {
      console.error('Erreur upload multiple:', err);
      setError(`Upload échoué: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setError(`Vous ne pouvez sélectionner que 10 fichiers maximum. Actuellement: ${files.length}`);
      return;
    }
    setSelectedFiles(files);
    setError(null);
    
    const progress = {};
    files.forEach((file, index) => {
      progress[index] = 0;
    });
    setUploadProgress(progress);
  };
  
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const resetUploadForm = () => {
    setSelectedFiles([]);
    setUploadTitle('');
    setUploadDescription('');
    setUploadVisibility('private');
    setUploadCategories('');
    setUploadTags('');
    setUploadProgress({});
  };
  
  const handleDelete = async () => {
    if (!assetToDelete) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur suppression: ${response.status}`);
      }
      
      setShowConfirmModal(false);
      setAssetToDelete(null);
      await fetchAssets();
      
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError(`Suppression échouée: vous n'avez pas le droit de supprimer ce fichier`);
      setShowConfirmModal(false);
    }
  };
  
  const handleDownload = async (assetId, assetName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur téléchargement: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = assetName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      setError(`Téléchargement échoué: ${err.message}`);
    }
  };
  
const openAssetPreview = (asset) => {
  if (is3DModel(asset)) {
    const token = localStorage.getItem('token');
    if (!token) { setError('Vous devez être connecté'); return; }

    // Try every possible source for the extension
    let cleanExt = (asset.ext || asset.file_ext || asset.extension || '')
      .replace(/^\./, '')
      .toLowerCase();

    // If still empty, infer from asset.name or asset.title
    if (!cleanExt) {
      const nameSource = asset.name || asset.title || '';
      const dotIdx = nameSource.lastIndexOf('.');
      if (dotIdx !== -1) cleanExt = nameSource.slice(dotIdx + 1).toLowerCase();
    }

    // If still empty but file_type is 3d_model, default to glb
    if (!cleanExt && asset.file_type === '3d_model') cleanExt = 'glb';

    let fileName = asset.title || asset.name || 'model';
    if (cleanExt && !fileName.toLowerCase().endsWith(`.${cleanExt}`)) {
      fileName = `${fileName}.${cleanExt}`;
    }

    setSelectedModel({ id: asset.id, name: fileName, token, ext: cleanExt });
    setShowModelViewer(true);
  } else {
    openPreview(asset.title || asset.name);
  }
};
  
  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 MB';
    if (bytes === 0) return '0 MB';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formattedSize = (bytes / Math.pow(1024, i)).toFixed(2);
    
    return `${formattedSize} ${sizes[i]}`;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };
  
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearch = (value) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      handleFilterChange('search', value);
    }, 500));
  };
  
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);
  
  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);
  
  if (loading && assets.length === 0) {
    return (
      <div className="tbl-wrap" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden', padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--dim)' }}>Chargement des assets...</div>
      </div>
    );
  }
  
  return (
    <>
      <div className="tbl-wrap" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div className="tbl-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <span className="card-title">{isGfx ? 'Assets créatifs' : 'Assets techniques'}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>{totalAssets} fichiers</span>
            </div>
            
            <select 
              value={filters.file_type}
              onChange={(e) => handleFilterChange('file_type', e.target.value)}
              style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '4px 8px', color: 'white', fontSize: 12 }}
            >
              <option value="">Tous les types</option>
              <option value="image">Images</option>
              <option value="video">Vidéos</option>
              <option value="3d_model">Modèles 3D</option>
              <option value="archive">Archives</option>
              <option value="document">Documents</option>
            </select>
            
            <select 
              value={filters.visibility}
              onChange={(e) => handleFilterChange('visibility', e.target.value)}
              style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '4px 8px', color: 'white', fontSize: 12 }}
            >
              <option value="public">Public</option>
              <option value="private">Privé</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              placeholder="Rechercher..."
              onChange={(e) => handleSearch(e.target.value)}
              style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '4px 12px', color: 'white', fontSize: 12, width: 180 }}
            />
            <button 
              className="btn btn-primary" 
              onClick={() => setShowUploadModal(true)}
              style={{ background: 'var(--blue)', border: 'none', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', color: 'white' }}
            >
              Upload
            </button>
          </div>
        </div>
        
        {error && (
          <div style={{ padding: '12px 18px', background: 'rgba(220,38,38,.15)', color: '#ef4444', fontSize: 12, borderBottom: '1px solid rgba(220,38,38,.3)' }}>
            ⚠️ {error}
          </div>
        )}
        
        {assets.length > 0 ? (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>Fichier</th>
                <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>Taille</th>
                <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>Preview</th>
                <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '12px 18px' }}>
                    <div className="file-cell" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={`file-icon ${asset.icon || asset.ext?.toLowerCase()}`} style={{ 
                        width: 32, 
                        height: 32, 
                        background: is3DModel(asset) ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,.05)', 
                        borderRadius: 6, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: 10, 
                        fontWeight: 600, 
                        color: is3DModel(asset) ? '#A78BFA' : 'var(--muted)'
                      }}>
                        {is3DModel(asset) ? '🎨' : asset.ext}
                      </div>
                      <div>
                        <div className="fn" style={{ fontWeight: 500, fontSize: 13, color: 'white' }}>{asset.title || asset.name}</div>
                        {asset.description && <div className="fm" style={{ fontSize: 10, color: 'var(--muted)' }}>{asset.description}</div>}
                        {is3DModel(asset) && <div style={{ fontSize: 9, color: '#A78BFA', marginTop: 2 }}>🎨 Modèle 3D</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
                    {formatSize(asset.file_size || asset.size || 0)}
                  </td>
                  <td style={{ padding: '12px 18px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--dim)' }}>
                    {formatDate(asset.created_at || asset.date)}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <button 
                      className="action-btn" 
                      onClick={() => openAssetPreview(asset)}
                      style={{ 
                        background: is3DModel(asset) ? 'rgba(139,92,246,0.2)' : 'transparent', 
                        border: 'none', 
                        color: is3DModel(asset) ? '#A78BFA' : 'var(--muted)', 
                        cursor: 'pointer', 
                        padding: 4,
                        borderRadius: 4
                      }}
                      title={is3DModel(asset) ? 'Visualisation 3D' : 'Aperçu'}
                    >
                      {is3DModel(asset) ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <div className="action-group" style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="action-btn" 
                        onClick={() => handleDownload(asset.id, asset.name)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7,10 12,15 17,10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      <button 
                        className="action-btn" 
                        onClick={() => {
                          setAssetToDelete({ id: asset.id, name: asset.title || asset.name });
                          setShowConfirmModal(true);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !loading && (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--dim)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
            <div>Aucun asset trouvé</div>
            {error && <div style={{ fontSize: 12, marginTop: 8, color: '#ef4444' }}>{error}</div>}
          </div>
        )}
        
        {totalPages > 1 && assets.length > 0 && (
          <div className="pag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--b2)' }}>
            <span className="pag-i" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)' }}>
              {totalAssets > 0 ? ((page - 1) * 20) + 1 : 0}–{Math.min(page * 20, totalAssets)} / {totalAssets}
            </span>
            <div className="pag-btns" style={{ display: 'flex', gap: 3 }}>
              <button className="pb" onClick={() => handlePageChange(page - 1)} disabled={page === 1} style={{ width: 27, height: 27, borderRadius: 5, border: '1px solid rgba(255,255,255,.06)', background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, color: 'white' }}>‹</button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                if (pageNum > totalPages) return null;
                return (
                  <button key={i} className={`pb ${pageNum === page ? 'on' : ''}`} onClick={() => handlePageChange(pageNum)} style={{ width: 27, height: 27, borderRadius: 5, border: '1px solid rgba(255,255,255,.06)', background: pageNum === page ? 'rgba(59,130,246,.15)' : 'transparent', borderColor: pageNum === page ? 'rgba(59,130,246,.4)' : undefined, color: pageNum === page ? 'var(--blue)' : 'white', cursor: 'pointer' }}>{pageNum}</button>
                );
              })}
              <button className="pb" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} style={{ width: 27, height: 27, borderRadius: 5, border: '1px solid rgba(255,255,255,.06)', background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, color: 'white' }}>›</button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal d'upload multiple */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>
          <div className="upload-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <div className="upload-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="upload-modal-title-section">
                <h3 className="upload-modal-title">Uploader des assets</h3>
                <p className="upload-modal-subtitle">Ajoutez jusqu'à 10 fichiers • Max 500 MB par fichier</p>
              </div>
              <button className="upload-modal-close" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>×</button>
            </div>
            <form onSubmit={handleMultipleUpload}>
              <div className="upload-modal-body">
                <div className="upload-dropzone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files); if (files.length > 0 && files.length <= 10) { setSelectedFiles(files); } else if (files.length > 10) { setError("Maximum 10 fichiers"); } }}>
                  <input type="file" id="file-upload-input" multiple onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,video/*,.glb,.gltf,.fbx,.obj,.zip,.rar,.7z,.psd,.ai,.json,.pdf,.doc,.docx" />
                  <label htmlFor="file-upload-input" className="upload-dropzone-label">
                    <div className="upload-dropzone-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17,8 12,3 7,8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div className="upload-dropzone-title">Cliquez ou glissez-déposez</div>
                    <div className="upload-dropzone-hint">PNG, JPG, MP4, GLB, FBX, OBJ, ZIP, PSD, AI, PDF...</div>
                  </label>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="upload-files-list">
                    <div className="upload-files-header">
                      <span className="upload-files-count">{selectedFiles.length} fichier(s) sélectionné(s)</span>
                      <button type="button" className="upload-files-clear" onClick={() => setSelectedFiles([])}>Tout effacer</button>
                    </div>
                    <div className="upload-files-grid">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="upload-file-item">
                          <div className="upload-file-icon">{file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('video/') ? '🎬' : file.name.endsWith('.glb') || file.name.endsWith('.gltf') || file.name.endsWith('.fbx') || file.name.endsWith('.obj') ? '🎨' : file.name.endsWith('.zip') || file.name.endsWith('.rar') ? '📦' : file.name.endsWith('.psd') || file.name.endsWith('.ai') ? '🎯' : '📄'}</div>
                          <div className="upload-file-info">
                            <div className="upload-file-name" title={file.name}>{file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name}</div>
                            <div className="upload-file-size">{formatSize(file.size)}</div>
                          </div>
                          <button type="button" className="upload-file-remove" onClick={() => removeFile(index)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="upload-metadata">
                  <div className="upload-metadata-row">
                    <div className="upload-metadata-field">
                      <label className="upload-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M20 12v8H4v-8M12 2v12m0 0-3-3m3 3 3-3" /></svg>Titre par défaut</label>
                      <input type="text" className="upload-input" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Optionnel - Appliqué à tous les fichiers" />
                    </div>
                    <div className="upload-metadata-field">
                      <label className="upload-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M4 4h16v16H4zM9 9h6v6H9z" /></svg>Tags</label>
                      <input type="text" className="upload-input" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="ex: 3d, design, ui-kit" />
                    </div>
                  </div>
                  <div className="upload-metadata-row">
                    <div className="upload-metadata-field">
                      <label className="upload-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>Description</label>
                      <textarea className="upload-textarea" rows="2" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Optionnelle - Description commune à tous les fichiers" />
                    </div>
                    <div className="upload-metadata-field">
                      <label className="upload-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>Visibilité</label>
                      <div className="upload-visibility-options">
                        <label className="upload-radio"><input type="radio" value="private" checked={uploadVisibility === 'private'} onChange={(e) => setUploadVisibility(e.target.value)} /><span>🔒 Privé</span></label>
                        <label className="upload-radio"><input type="radio" value="public" checked={uploadVisibility === 'public'} onChange={(e) => setUploadVisibility(e.target.value)} /><span>🌍 Public</span></label>
                      </div>
                    </div>
                  </div>
                  <div className="upload-metadata-field">
                    <label className="upload-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M20 7h-4.18A3 3 0 0 0 16 5.18V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>Catégories (UUIDs)</label>
                    <input type="text" className="upload-input" value={uploadCategories} onChange={(e) => setUploadCategories(e.target.value)} placeholder="uuid1, uuid2, uuid3" />
                    <div className="upload-hint">IDs des catégories séparés par des virgules</div>
                  </div>
                </div>
                {error && <div className="upload-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>{error}</div>}
              </div>
              <div className="upload-modal-footer">
                <button type="button" className="upload-btn upload-btn-secondary" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>Annuler</button>
                <button type="submit" className="upload-btn upload-btn-primary" disabled={uploading || selectedFiles.length === 0}>
                  {uploading ? (<><svg className="upload-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>Upload en cours...</>) : (<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>Uploader {selectedFiles.length} fichier(s)</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de confirmation de suppression */}
      {showConfirmModal && assetToDelete && (
        <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirmer la suppression</h3><button className="modal-close" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>×</button></div>
            <div className="modal-body"><p>Êtes-vous sûr de vouloir supprimer <strong>{assetToDelete.name}</strong> ?</p></div>
            <div className="modal-footer"><button className="modal-btn modal-btn-cancel" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>Annuler</button><button className="modal-btn modal-btn-delete" onClick={handleDelete}>Supprimer</button></div>
          </div>
        </div>
      )}
      
      {/* Vue 3D - Model Viewer */}
      {showModelViewer && selectedModel && (
        <ModelViewer
          assetId={selectedModel.id}
          assetName={selectedModel.name}
          token={localStorage.getItem('token')}
          assetExt={selectedModel.ext}
          onClose={() => {
            setShowModelViewer(false);
            setSelectedModel(null);
          }}
        />
      )}
    </>
  );
}