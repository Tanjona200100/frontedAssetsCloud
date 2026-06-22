// components/AdminDashboard/AssetsPanel.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { LiaEyeSolid, LiaDownloadSolid, LiaTrashAltSolid, LiaLockSolid, LiaGlobeSolid, LiaImageSolid, LiaUserSolid, LiaFolderOpen, LiaTagSolid } from 'react-icons/lia';
import { PiCubeLight } from "react-icons/pi";
import { FaRegFile } from "react-icons/fa6";
import { RiDossierFill } from "react-icons/ri";
import { MdFilterList, MdClose } from 'react-icons/md';
import PreviewModal from './PreviewModal';

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

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date inconnue';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const is3DModel = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  const supported3DFormats = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds'];

  return supported3DFormats.includes(ext) || fileType === '3d_model' ||
    supported3DFormats.some(format => name?.endsWith(`.${format}`));
};

const AssetsPanel = ({ searchQuery = '' }) => {

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredAssetId, setHoveredAssetId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const isMounted = useRef(true);

  // États pour les filtres avancés
  const [filters, setFilters] = useState({
    search: searchQuery,
    visibility: '',
    file_type: '',
    category: '',
    project: '',
    created_by: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    window.downloadAsset = handleDownloadFromModal;
    return () => {
      delete window.downloadAsset;
    };
  }, [assets]);
  // Synchroniser avec la recherche de la topbar
  useEffect(() => {
    if (searchQuery !== filters.search) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
      setPage(1);
    }
  }, [searchQuery]);

  // Récupérer les assets
  const fetchAssets = useCallback(async (pageNum = page) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      // Construire l'URL avec les filtres
      let url = `/assets?page=${pageNum}&limit=20`;

      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
      if (filters.visibility) url += `&visibility=${filters.visibility}`;
      if (filters.file_type) url += `&file_type=${filters.file_type}`;
      if (filters.category) url += `&category_id=${filters.category}`;
      if (filters.project) url += `&project_id=${filters.project}`;
      if (filters.created_by) url += `&created_by=${filters.created_by}`;
      if (filters.date_from) url += `&date_from=${filters.date_from}`;
      if (filters.date_to) url += `&date_to=${filters.date_to}`;

      const data = await apiRequest(url);

      setAssets(data.assets || data.data || []);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
      setTotalAssets(data.pagination?.total || data.total || 0);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement assets:', err);
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // Récupérer les projets
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/simple`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erreur chargement projets');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Erreur fetchProjects:', err);
    }
  }, []);

  // Récupérer les catégories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erreur chargement catégories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Erreur fetchCategories:', err);
    }
  }, []);

  // Récupérer les utilisateurs
  const fetchUsers = useCallback(async () => {
    try {
      let usersData = [];
      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          usersData = data.users || data.data || data;
        }
      } catch (e) {
        console.log('Endpoint /users non disponible');
      }

      if (usersData.length === 0) {
        try {
          const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            usersData = data.users || data.data || data;
          }
        } catch (e) {
          console.log('Endpoint /admin/users non disponible');
        }
      }

      setUsers(usersData);
    } catch (err) {
      console.error('Erreur fetchUsers:', err);
    }
  }, []);

  // Supprimer un asset
  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      setDeletingId(assetToDelete.id);
      await apiRequest(`/assets/${assetToDelete.id}`, { method: 'DELETE' });

      setShowConfirmModal(false);
      setAssetToDelete(null);
      await fetchAssets(page);
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

      const response = await fetch(`${API_BASE_URL}/assets/${asset.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.file_name || asset.title || asset.name;
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

  // Voir l'asset (prévisualisation)
  const handleView = (asset) => {
    setPreviewAsset(asset);
    setShowPreviewModal(true);
  };

  // une fonction de téléchargement pour le modal
  const handleDownloadFromModal = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      handleDownload(asset);
    }
  };

  // Changer de page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Gestion des filtres
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      visibility: '',
      file_type: '',
      category: '',
      project: '',
      created_by: '',
      date_from: '',
      date_to: ''
    });
    setPage(1);
  };

  // Compter le nombre de filtres actifs
  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  useEffect(() => {
    fetchAssets(page);
  }, [fetchAssets, page]);

  useEffect(() => {
    fetchProjects();
    fetchCategories();
    fetchUsers();
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

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
              <span className="card-title">Gestion des Assets</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>
                {totalAssets} fichiers
                {activeFiltersCount > 0 && ` • ${activeFiltersCount} filtre(s) actif(s)`}
              </span>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                background: showFilters ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.05)',
                border: `1px solid ${showFilters ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.1)'}`,
                borderRadius: 6,
                padding: '4px 10px',
                color: showFilters ? '#3B82F6' : 'var(--dim)',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <MdFilterList size={14} />
              Filtres
              {activeFiltersCount > 0 && (
                <span style={{
                  background: '#3B82F6',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '1px 6px',
                  fontSize: 10,
                  marginLeft: 2
                }}>
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                style={{
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: 'var(--dim)',
                  cursor: 'pointer',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <MdClose size={14} />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Panneau des filtres avancés */}
        {showFilters && (
          <div style={{
            padding: '16px 18px',
            borderTop: '1px solid rgba(255,255,255,.06)',
            background: 'rgba(0,0,0,.2)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {/* Filtre par catégorie */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>
                <LiaTagSolid size={12} style={{ marginRight: 4 }} />
                Catégorie
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 12
                }}
              >
                <option value="">Toutes</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon || '📁'} {cat.display_name || cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par projet */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>
                <LiaFolderOpen size={12} style={{ marginRight: 4 }} />
                Projet
              </label>
              <select
                value={filters.project}
                onChange={(e) => handleFilterChange('project', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 12
                }}
              >
                <option value="">Tous</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par type */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>Type</label>
              <select
                value={filters.file_type}
                onChange={(e) => handleFilterChange('file_type', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 12
                }}
              >
                <option value="">Tous</option>
                <option value="image">🖼️ Images</option>
                <option value="video">🎬 Vidéos</option>
                <option value="3d_model">🎮 Modèles 3D</option>
                <option value="archive">📦 Archives</option>
                <option value="document">📄 Documents</option>
                <option value="audio">🎵 Audio</option>
                <option value="other">📎 Autres</option>
              </select>
            </div>

            {/* Filtre par visibilité */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>Visibilité</label>
              <select
                value={filters.visibility}
                onChange={(e) => handleFilterChange('visibility', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 12
                }}
              >
                <option value="">Toutes</option>
                <option value="public">🌍 Public</option>
                <option value="team">👥 Team</option>
                <option value="private">🔒 Privé</option>
              </select>
            </div>

            {/* Filtre par créateur */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>
                <LiaUserSolid size={12} style={{ marginRight: 4 }} />
                Créateur
              </label>
              <select
                value={filters.created_by}
                onChange={(e) => handleFilterChange('created_by', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 12
                }}
              >
                <option value="">Tous</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name || user.name || user.email || `Utilisateur ${user.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 18px', background: 'rgba(220,38,38,.15)', color: '#ef4444', fontSize: 12, borderBottom: '1px solid rgba(220,38,38,.3)' }}>
            {error}
          </div>
        )}

        {/* Grille des assets - Même affichage que l'espace utilisateur */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
          padding: '18px'
        }}>
          {assets.map((asset) => {
            const is3D = is3DModel(asset);
            const isHovered = hoveredAssetId === asset.id;
            const isDeleting = deletingId === asset.id;
            const isDownloading = downloadingId === asset.id;

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
                  onClick={() => {
                    setPreviewAsset(asset);
                    setShowPreviewModal(true);
                  }}
                  style={{
                    height: 200,
                    background: 'rgba(0,0,0,.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                >
                  {is3D ? (
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
                    asset.capture_url ? (
                      <img
                        src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
                        alt={`Aperçu de ${asset.title || asset.name}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 64, opacity: 0.5 }}><FaRegFile /></div>
                    )
                  )}
                </div>

                {/* Informations */}
                <div style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: 'white' }}>
                    {asset.title || asset.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                    {formatFileSize(asset.file_size || asset.size)} • {formatDate(asset.created_at)}
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

                  {/* Tags d'information */}
                  <div style={{
                    display: 'flex',
                    gap: 4,
                    flexWrap: 'wrap',
                    marginBottom: 8
                  }}>
                    {asset.category_name && (
                      <span style={{
                        fontSize: 9,
                        background: 'rgba(59,130,246,.15)',
                        color: '#3B82F6',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        {asset.category_name}
                      </span>
                    )}
                    {asset.project_name && (
                      <span style={{
                        fontSize: 9,
                        background: 'rgba(16,185,129,.15)',
                        color: '#10B981',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        {asset.project_name}
                      </span>
                    )}
                    {asset.first_name && (
                      <span style={{
                        fontSize: 9,
                        background: 'rgba(139,92,246,.15)',
                        color: '#8B5CF6',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        <LiaUserSolid size={10} style={{ marginRight: 2 }} />
                        {asset.first_name} {asset.last_name || ''}
                      </span>
                    )}
                    <span style={{
                      fontSize: 9,
                      background: asset.visibility === 'public' ? 'rgba(16,185,129,.15)' : asset.visibility === 'team' ? 'rgba(59,130,246,.15)' : 'rgba(239,68,68,.15)',
                      color: asset.visibility === 'public' ? '#10B981' : asset.visibility === 'team' ? '#3B82F6' : '#EF4444',
                      padding: '2px 8px',
                      borderRadius: 10
                    }}>
                      {asset.visibility === 'public' ? '🌍 Public' :
                        asset.visibility === 'team' ? '👥 Team' : '🔒 Privé'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: '1px solid rgba(255,255,255,.06)',
                    paddingTop: 12,
                    marginTop: 4
                  }}>
                    <button
                      onClick={() => {
                        setPreviewAsset(asset);
                        setShowPreviewModal(true);
                      }}
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
                      onClick={() => handleDownload(asset)}
                      disabled={isDownloading}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,.05)',
                        border: 'none',
                        padding: '7px 12px',
                        borderRadius: 6,
                        color: isDownloading ? '#666' : '#888',
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDownloading) e.currentTarget.style.background = 'rgba(255,255,255,.1)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isDownloading) e.currentTarget.style.background = 'rgba(255,255,255,.05)';
                      }}
                      title="Télécharger"
                    >
                      {isDownloading ? (
                        <span style={{ fontSize: '10px' }}>...</span>
                      ) : (
                        <LiaDownloadSolid size={14} />
                      )}
                    </button>

                    {/* Bouton Supprimer */}
                    <button
                      onClick={() => {
                        setAssetToDelete({ id: asset.id, name: asset.title || asset.name });
                        setShowConfirmModal(true);
                      }}
                      disabled={isDeleting}
                      style={{
                        flex: 1,
                        background: 'rgba(220,38,38,.1)',
                        border: 'none',
                        padding: '7px 12px',
                        borderRadius: 6,
                        color: isDeleting ? '#666' : '#ef4444',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeleting) e.currentTarget.style.background = 'rgba(220,38,38,.2)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isDeleting) e.currentTarget.style.background = 'rgba(220,38,38,.1)';
                      }}
                      title="Supprimer"
                    >
                      {isDeleting ? (
                        <span style={{ fontSize: '10px' }}>...</span>
                      ) : (
                        <LiaTrashAltSolid size={14} />
                      )}
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
            <div>Aucun asset trouvé{activeFiltersCount > 0 ? ' avec les filtres actuels' : ''}</div>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                style={{
                  marginTop: 16,
                  background: 'rgba(255,255,255,.1)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
            <span className="pag-i" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)' }}>
              {totalAssets > 0 ? ((page - 1) * 20) + 1 : 0}–{Math.min(page * 20, totalAssets)} / {totalAssets}
            </span>
            <div className="pag-btns" style={{ display: 'flex', gap: 3 }}>
              <button
                className="pb"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                style={{
                  width: 27, height: 27, borderRadius: 5,
                  border: '1px solid rgba(255,255,255,.06)',
                  background: 'transparent',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                  color: 'white'
                }}
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
                      width: 27, height: 27, borderRadius: 5,
                      border: '1px solid rgba(255,255,255,.06)',
                      background: pageNum === page ? 'rgba(59,130,246,.15)' : 'transparent',
                      borderColor: pageNum === page ? 'rgba(59,130,246,.4)' : undefined,
                      color: pageNum === page ? '#3B82F6' : 'white',
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
                style={{
                  width: 27, height: 27, borderRadius: 5,
                  border: '1px solid rgba(255,255,255,.06)',
                  background: 'transparent',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                  color: 'white'
                }}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {showPreviewModal && previewAsset && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewAsset(null);
          }}
          data={previewAsset}
        />
      )}

      {/* Modal de confirmation suppression */}
      {showConfirmModal && assetToDelete && (
        <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmer la suppression</h3>
              <button className="modal-close" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>×</button>
            </div>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir supprimer <strong>{assetToDelete.name}</strong> ?</p>
              <p style={{ fontSize: 12, color: '#ef4444' }}>Cette action est irréversible.</p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,.1)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                className="modal-btn modal-btn-delete"
                onClick={handleDelete}
                disabled={deletingId === assetToDelete.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  cursor: deletingId === assetToDelete.id ? 'not-allowed' : 'pointer',
                  opacity: deletingId === assetToDelete.id ? 0.5 : 1
                }}
              >
                {deletingId === assetToDelete.id ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-container {
          background: #0a0f1a;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 16px;
          color: white;
        }
        
        .modal-close {
          background: none;
          border: none;
          color: #666;
          font-size: 20px;
          cursor: pointer;
        }
        
        .modal-body {
          margin-bottom: 20px;
          color: var(--text);
        }
        
        .modal-body p {
          margin: 0 0 8px 0;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `}</style>
    </>
  );
};

export default AssetsPanel;