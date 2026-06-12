// src/components/UserDashboard/AssetsPanel.jsx
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserContext } from '../../pages/UserDashboard';
import ModelViewer from './ModelViewer';
import { LiaEyeSolid, LiaDownloadSolid, LiaTrashAltSolid, LiaUploadSolid, LiaLockSolid, LiaGlobeSolid, LiaImageSolid } from 'react-icons/lia';
import { PiCubeLight } from "react-icons/pi";
import { FaRegFile } from "react-icons/fa6";
import { RiDossierFill } from "react-icons/ri";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.sub || payload.id || null;
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
};

export default function AssetsPanel() {
  const { role, openPreview } = useContext(UserContext);
  const isGfx = role === 'gfx';

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);

  const [filters, setFilters] = useState({
    visibility: '',
    file_type: '',
    search: ''
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadCategories, setUploadCategories] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadCapture, setUploadCapture] = useState(null);
  const [uploadCapturePreview, setUploadCapturePreview] = useState(null);
  const [uploadTriangleCount, setUploadTriangleCount] = useState('');
  const [perFileDetails, setPerFileDetails] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [hoveredAssetId, setHoveredAssetId] = useState(null);

  const is3DModel = (asset) => {
    const ext = asset.ext?.toLowerCase().replace(/^\./, '');
    const fileType = asset.file_type?.toLowerCase();
    const name = asset.name?.toLowerCase();
    const supported3DFormats = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds'];

    return supported3DFormats.includes(ext) || fileType === '3d_model' ||
      supported3DFormats.some(format => name?.endsWith(`.${format}`));
  };

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);
      if (filters.visibility) params.append('visibility', filters.visibility);
      if (filters.file_type) params.append('file_type', filters.file_type);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_BASE_URL}/assets?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Non autorisé');
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      const assetsData = data.data || data.assets || [];

      setAssets(assetsData);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
      setTotalAssets(data.pagination?.total || data.total || assetsData.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

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

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      selectedFiles.forEach(file => {
        formData.append('assets', file);
      });

      if (uploadCapture) {
        formData.append('captures', uploadCapture);
      }

      if (uploadVisibility) formData.append('visibility', uploadVisibility);
      if (uploadCategories) formData.append('categories', uploadCategories);
      if (uploadTags) formData.append('tags', uploadTags);
      if (uploadTitle) formData.append('default_title', uploadTitle);
      if (uploadDescription) formData.append('default_description', uploadDescription);
      if (uploadTriangleCount) formData.append('triangle_counts', uploadTriangleCount);

      const response = await fetch(`${API_BASE_URL}/assets/upload-multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error(`Upload échoué (${response.status})`);

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
    setUploadCapture(null);
    setUploadCapturePreview(null);
    setUploadTriangleCount('');
    setUploadProgress({});
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error(`Erreur: ${response.status}`);

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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error(`Erreur: ${response.status}`);

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
      setError(`Téléchargement échoué: ${err.message}`);
    }
  };

  const openAssetPreview = (asset) => {
    if (is3DModel(asset)) {
      const token = localStorage.getItem('token');
      if (!token) { setError('Connectez-vous'); return; }

      let cleanExt = (asset.ext || asset.file_ext || asset.extension || '')
        .replace(/^\./, '')
        .toLowerCase();

      if (!cleanExt) {
        const nameSource = asset.name || asset.title || '';
        const dotIdx = nameSource.lastIndexOf('.');
        if (dotIdx !== -1) cleanExt = nameSource.slice(dotIdx + 1).toLowerCase();
      }

      if (!cleanExt && asset.file_type === '3d_model') cleanExt = 'glb';

      let fileName = asset.title || asset.name || 'model';
      if (cleanExt && !fileName.toLowerCase().endsWith(`.${cleanExt}`)) {
        fileName = `${fileName}.${cleanExt}`;
      }

      setSelectedModel({ id: asset.id, name: fileName, token, ext: cleanExt, asset });
      setShowModelViewer(true);
    } else {
      openPreview(asset.title || asset.name);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 MB';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleCaptureSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('La capture doit être une image (JPG, PNG, WebP)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('La capture ne doit pas dépasser 10 MB');
        return;
      }
      setUploadCapture(file);
      const previewUrl = URL.createObjectURL(file);
      setUploadCapturePreview(previewUrl);
    }
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
              value={filters.visibility}
              onChange={(e) => handleFilterChange('visibility', e.target.value)}
              style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '4px 8px', color: 'white', fontSize: 12 }}
            >
              <option value="">Tous</option>
              <option value="public">Public</option>
              <option value="private">Privé</option>
            </select>

            <select
              value={filters.file_type}
              onChange={(e) => handleFilterChange('file_type', e.target.value)}
              style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '4px 8px', color: 'white', fontSize: 12 }}
            >
              <option value="">Tous types</option>
              <option value="image">Images</option>
              <option value="video">Vidéos</option>
              <option value="3d_model">Modèles 3D</option>
              <option value="archive">Archives</option>
              <option value="document">Documents</option>
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
              style={{ background: '#3B82F6', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LiaUploadSolid size={16} />
              Upload
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 18px', background: 'rgba(220,38,38,.15)', color: '#ef4444', fontSize: 12, borderBottom: '1px solid rgba(220,38,38,.3)' }}>
            {error}
          </div>
        )}

        {/* Grille des assets */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
          padding: '18px'
        }}>
          {assets.map((asset) => {
            const is3D = is3DModel(asset);
            const isHovered = hoveredAssetId === asset.id;
            console.log (asset.capture_url);

            return (
              <div
                key={asset.id}
                style={{
                  background: 'rgba(0,0,0,.3)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${isHovered ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.06)'}`,
                  transition: 'transform 0.2s, border-color 0.2s',
                  transform: isHovered ? 'translateY(-4px)' : 'none'
                }}
                onMouseEnter={() => setHoveredAssetId(asset.id)}
                onMouseLeave={() => setHoveredAssetId(null)}
              >
                {/* Zone de preview cliquable */}
                <div
                  onClick={() => openAssetPreview(asset)}
                  style={{
                    height: 200,
                    background: 'rgba(0,0,0,.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden' // Important pour que l'image ne dépasse pas
                  }}
                >
                  {is3D ? (
                    // Si une capture existe, on l'affiche
                    asset.capture_url ? (
                      <>
                        <img
                          src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
                          alt={`Aperçu de ${asset.title || asset.name}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                          onError={(e) => {
                            // Si l'image ne charge pas, on affiche l'icône par défaut
                            e.target.style.display = 'none';
                            e.target.parentElement.querySelector('.default-3d-preview').style.display = 'flex';
                          }}
                        />
                        <div className="default-3d-preview" style={{ display: 'none', textAlign: 'center' }}>
                          <div style={{ fontSize: 64, marginBottom: 8 }}><PiCubeLight /></div>
                          <div style={{ fontSize: 12, color: '#3b82f6' }}>Modèle 3D</div>
                        </div>
                        {isHovered && (
                          <div style={{
                            position: 'absolute',
                            bottom: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,.8)',
                            padding: '6px 14px',
                            borderRadius: 20,
                            fontSize: 12,
                            color: '#10b981',
                            whiteSpace: 'nowrap',
                            zIndex: 2
                          }}>
                            ✨ Cliquer pour visualiser
                          </div>
                        )}
                      </>
                    ) : (
                      // Pas de capture, on affiche l'icône par défaut
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 64, marginBottom: 8 }}><PiCubeLight /></div>
                        <div style={{ fontSize: 12, color: '#3b82f6' }}>Modèle 3D</div>
                        {isHovered && (
                          <div style={{
                            position: 'absolute',
                            bottom: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,.8)',
                            padding: '6px 14px',
                            borderRadius: 20,
                            fontSize: 12,
                            color: '#10b981',
                            whiteSpace: 'nowrap'
                          }}>
                            ✨ Cliquer pour visualiser
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div style={{ fontSize: 64, opacity: 0.5 }}><FaRegFile /></div>
                  )}
                </div>

                {/* Informations */}
                <div style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: 'white' }}>
                    {asset.title || asset.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                    {formatSize(asset.file_size || asset.size)} • {formatDate(asset.created_at)}
                  </div>
                  {asset.description && (
                    <div style={{
                      fontSize: 11,
                      color: '#888',
                      marginBottom: 10,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {asset.description}
                    </div>
                  )}
                  {is3D && (
                    <div style={{ fontSize: 10, color: '#10b981', marginBottom: 10 }}>
                      <PiCubeLight /> Modèle 3D
                    </div>
                  )}

                  {/* Actions - tous les boutons uniformes */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: '1px solid rgba(255,255,255,.06)',
                    paddingTop: 12,
                    marginTop: 4
                  }}>
                    <button
                      onClick={() => openAssetPreview(asset)}
                      style={{
                        flex: 1,
                        background: 'rgba(59,130,246,.15)',
                        border: 'none',
                        padding: '7px',
                        borderRadius: 6,
                        color: '#3B82F6',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,.25)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59,130,246,.15)'}
                    >
                      <LiaEyeSolid size={14} />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(asset.id, asset.name)}
                      style={{
                        background: 'rgba(255,255,255,.05)',
                        border: 'none',
                        padding: '7px 12px',
                        borderRadius: 6,
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                      title="Télécharger"
                    >
                      <LiaDownloadSolid size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setAssetToDelete({ id: asset.id, name: asset.title || asset.name });
                        setShowConfirmModal(true);
                      }}
                      style={{
                        background: 'rgba(220,38,38,.1)',
                        border: 'none',
                        padding: '7px 12px',
                        borderRadius: 6,
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.1)'}
                      title="Supprimer"
                    >
                      <LiaTrashAltSolid size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {assets.length === 0 && !loading && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}><RiDossierFill /></div>
            <div>Aucun asset trouvé</div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--b2)' }}>
            <span className="pag-i" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)' }}>
              {totalAssets > 0 ? ((page - 1) * 20) + 1 : 0}–{Math.min(page * 20, totalAssets)} / {totalAssets}
            </span>
            <div className="pag-btns" style={{ display: 'flex', gap: 3 }}>
              <button className="pb" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 27, height: 27, borderRadius: 5, border: '1px solid rgba(255,255,255,.06)', background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, color: 'white' }}>‹</button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                if (pageNum > totalPages) return null;
                return (
                  <button key={i} className={`pb ${pageNum === page ? 'on' : ''}`} onClick={() => setPage(pageNum)} style={{ width: 27, height: 27, borderRadius: 5, border: '1px solid rgba(255,255,255,.06)', background: pageNum === page ? 'rgba(59,130,246,.15)' : 'transparent', borderColor: pageNum === page ? 'rgba(59,130,246,.4)' : undefined, color: pageNum === page ? '#3B82F6' : 'white', cursor: 'pointer' }}>{pageNum}</button>
                );
              })}
              <button className="pb" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 27, height: 27, borderRadius: 5, border: '1px solid rgba(255,255,255,.06)', background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, color: 'white' }}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'upload multiple - Version originale conservée */}
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
                      <input type="text" className="upload-input" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Optionnel" />
                    </div>
                    <div className="upload-metadata-field">
                      <label className="upload-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                          <polyline points="2 17 12 22 22 17" />
                          <polyline points="2 12 12 17 22 12" />
                        </svg>
                        Nombre de triangles
                      </label>
                      <input
                        type="number"
                        className="upload-input"
                        value={uploadTriangleCount}
                        onChange={(e) => setUploadTriangleCount(e.target.value)}
                        placeholder="ex: 12450"
                      />
                      <div className="upload-hint">Nombre de polygones/triangles du modèle 3D</div>
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
                        <label className="upload-radio"><input type="radio" value="private" checked={uploadVisibility === 'private'} onChange={(e) => setUploadVisibility(e.target.value)} /><span><LiaLockSolid /> Privé</span></label>
                        <label className="upload-radio"><input type="radio" value="public" checked={uploadVisibility === 'public'} onChange={(e) => setUploadVisibility(e.target.value)} /><span><LiaGlobeSolid /> Public</span></label>
                      </div>
                    </div>
                  </div>
                  <div className="upload-metadata-field">
                    <label className="upload-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" />
                        <circle cx="8.5" cy="8.5" r="2.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      Capture d'écran (aperçu 3D)
                    </label>
                    <div className="upload-capture-area">
                      <input
                        type="file"
                        id="capture-upload"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCaptureSelect}
                        style={{ display: 'none' }}
                      />
                      {uploadCapturePreview ? (
                        <div className="capture-preview">
                          <img src={uploadCapturePreview} alt="Aperçu" />
                          <button
                            type="button"
                            className="remove-capture"
                            onClick={() => {
                              setUploadCapture(null);
                              setUploadCapturePreview(null);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="capture-upload" className="capture-upload-label">
                          <div className="capture-upload-icon"><LiaImageSolid size={32} /></div>
                          <div>Cliquez pour ajouter une capture d'écran</div>
                          <div className="capture-upload-hint">JPG, PNG, WebP (max 10 MB)</div>
                        </label>
                      )}
                    </div>
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

      {/* Modal de confirmation suppression */}
      {showConfirmModal && assetToDelete && (
        <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirmer la suppression</h3><button className="modal-close" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>×</button></div>
            <div className="modal-body"><p>Êtes-vous sûr de vouloir supprimer <strong>{assetToDelete.name}</strong> ?</p></div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>Annuler</button>
              <button className="modal-btn modal-btn-delete" onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Vue 3D */}
      {showModelViewer && selectedModel && (
        <ModelViewer
          assetId={selectedModel.id}
          assetName={selectedModel.name}
          token={localStorage.getItem('token')}
          assetExt={selectedModel.ext}
          assetData={selectedModel.asset}
          onClose={() => {
            setShowModelViewer(false);
            setSelectedModel(null);
            setHoveredAssetId(null);
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}