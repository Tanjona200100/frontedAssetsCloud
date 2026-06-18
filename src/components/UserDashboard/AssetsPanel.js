// src/components/UserDashboard/AssetsPanel.jsx
import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserContext } from '../../pages/UserDashboard';
import ModelViewer from './ModelViewer';
import { LiaEyeSolid, LiaDownloadSolid, LiaTrashAltSolid, LiaUploadSolid, LiaLockSolid, LiaGlobeSolid, LiaImageSolid, LiaUserSolid, LiaFolderOpen, LiaTagSolid } from 'react-icons/lia';
import { PiCubeLight } from "react-icons/pi";
import { FaRegFile } from "react-icons/fa6";
import { RiDossierFill } from "react-icons/ri";
import { MdSearch, MdClose, MdFilterList } from 'react-icons/md';

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

// Fonction pour récupérer les données utilisateur depuis localStorage
const getUserData = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (e) {
    console.error('Erreur lors du parsing user:', e);
  }
  return {};
};

export default function AssetsPanel({ searchQuery = '' }) {
  const { role, openPreview } = useContext(UserContext);
  const isGfx = role === 'gfx';

  // Récupérer les données utilisateur
  const userData = getUserData();
  const isAdmin = userData?.role === 'admin' || userData?.is_admin === true;
  const currentUserId = userData?.id || userData?.user_id || getUserIdFromToken();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);

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

  const [showFilters, setShowFilters] = useState(false);
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
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Synchroniser avec la recherche de la topbar
  useEffect(() => {
    if (searchQuery !== filters.search) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
      setPage(1);
    }
  }, [searchQuery]);

  // Vérifier si l'utilisateur peut supprimer l'asset (admin ou propriétaire)
  const canDeleteAsset = (asset) => {
    if (isAdmin) return true;
    if (asset.created_by === currentUserId) return true;
    if (asset.uploaded_by === currentUserId) return true;
    if (asset.user_id === currentUserId) return true;
    return false;
  };

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
      
      // Ajouter tous les filtres
      if (filters.search) params.append('search', filters.search);
      if (filters.visibility) params.append('visibility', filters.visibility);
      if (filters.file_type) params.append('file_type', filters.file_type);
      if (filters.category) params.append('category_id', filters.category);
      if (filters.project) params.append('project_id', filters.project);
      if (filters.created_by) params.append('created_by', filters.created_by);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

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

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
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
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
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
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      // Essayer plusieurs endpoints
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

      if (usersData.length === 0) {
        // Fallback: extraire des assets
        const response = await fetch(`${API_BASE_URL}/assets?limit=100`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const assetsData = data.data || data.assets || [];
          const userMap = new Map();
          assetsData.forEach(asset => {
            const userId = asset.created_by || asset.uploaded_by || asset.user_id;
            if (userId && !userMap.has(userId)) {
              userMap.set(userId, {
                id: userId,
                name: asset.created_by_name || asset.uploaded_by_name || `Utilisateur ${userId}`
              });
            }
          });
          usersData = Array.from(userMap.values());
        }
      }

      setUsers(usersData);
    } catch (err) {
      console.error('Erreur fetchUsers:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

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
      if (selectedProject) {
        formData.append('project_id', selectedProject);
      }
      if (selectedCategory) {
        formData.append('categories', selectedCategory);
      }
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
    setSelectedProject('');
    setSelectedCategory('');
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

  // Réinitialiser tous les filtres
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
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.visibility) count++;
    if (filters.file_type) count++;
    if (filters.category) count++;
    if (filters.project) count++;
    if (filters.created_by) count++;
    if (filters.date_from || filters.date_to) count++;
    return count;
  }, [filters]);

  useEffect(() => {
    fetchAssets();
    fetchProjects();
    fetchCategories();
    fetchUsers();
  }, [fetchAssets, fetchProjects, fetchCategories, fetchUsers]);

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

          <div style={{ display: 'flex', gap: 8 }}>
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
          </div>
        )}

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
            const canDelete = canDeleteAsset(asset);

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
                    {asset.created_by_name && (
                      <span style={{
                        fontSize: 9,
                        background: 'rgba(139,92,246,.15)',
                        color: '#8B5CF6',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        <LiaUserSolid size={10} style={{ marginRight: 2 }} />
                        {asset.created_by_name}
                      </span>
                    )}
                    <span style={{
                      fontSize: 9,
                      background: asset.visibility === 'public' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)',
                      color: asset.visibility === 'public' ? '#10B981' : '#EF4444',
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
                        flex: 1,
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
                        gap: 6,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                      title="Télécharger"
                    >
                      <LiaDownloadSolid size={14} />
                    </button>
                    
                    {/* Bouton Supprimer - uniquement si admin ou propriétaire */}
                    {canDelete && (
                      <button
                        onClick={() => {
                          setAssetToDelete({ id: asset.id, name: asset.title || asset.name });
                          setShowConfirmModal(true);
                        }}
                        style={{
                          flex: 1,
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
                          gap: 6,
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.1)'}
                        title="Supprimer"
                      >
                        <LiaTrashAltSolid size={14} />
                      </button>
                    )}
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

      {/* Le reste du code (modaux) reste identique... */}
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
                      <label className="upload-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                          <path d="M20 7h-4.18A3 3 0 0 0 16 5.18V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                        </svg>
                        Projet
                      </label>
                      <select
                        className="upload-select"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,.3)',
                          border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 6,
                          color: 'white',
                          fontSize: 13
                        }}
                      >
                        <option value="">Aucun projet</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      <div className="upload-hint">Associer l'asset à un projet existant</div>
                    </div>

                    <div className="upload-metadata-field">
                      <label className="upload-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                          <rect x="2" y="2" width="20" height="20" rx="2.18" />
                          <circle cx="8.5" cy="8.5" r="2.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        Catégorie
                      </label>
                      <select
                        className="upload-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,.3)',
                          border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 6,
                          color: 'white',
                          fontSize: 13
                        }}
                      >
                        <option value="">Aucune catégorie</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon || '🏷️'} {category.display_name}
                          </option>
                        ))}
                      </select>
                      <div className="upload-hint">Associer l'asset à une catégorie</div>
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
                        <label className="upload-radio"><input type="radio" value="public" checked={uploadVisibility === 'public'} onChange={(e) => setUploadVisibility(e.target.value)} /><span><LiaGlobeSolid /> Public</span></label>
                        <label className="upload-radio"><input type="radio" value="private" checked={uploadVisibility === 'private'} onChange={(e) => setUploadVisibility(e.target.value)} /><span><LiaLockSolid /> Privé</span></label>
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
        
        .upload-modal-container {
          background: #0a0f1a;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .upload-modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,.1);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .upload-modal-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(59,130,246,.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3B82F6;
        }
        
        .upload-modal-title-section {
          flex: 1;
        }
        
        .upload-modal-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .upload-modal-subtitle {
          margin: 0;
          font-size: 12px;
          color: var(--dim);
        }
        
        .upload-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
        }
        
        .upload-modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        
        .upload-dropzone {
          border: 2px dashed rgba(255,255,255,.1);
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }
        
        .upload-dropzone:hover {
          border-color: rgba(59,130,246,.4);
          background: rgba(59,130,246,.05);
        }
        
        .upload-dropzone-icon {
          color: #666;
          margin-bottom: 12px;
        }
        
        .upload-dropzone-title {
          font-size: 14px;
          color: var(--text);
          margin-bottom: 4px;
        }
        
        .upload-dropzone-hint {
          font-size: 11px;
          color: var(--dim);
        }
        
        .upload-files-list {
          margin-bottom: 16px;
        }
        
        .upload-files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .upload-files-count {
          font-size: 12px;
          color: var(--dim);
        }
        
        .upload-files-clear {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 12px;
        }
        
        .upload-files-grid {
          display: grid;
          gap: 6px;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .upload-file-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(255,255,255,.05);
          border-radius: 6px;
        }
        
        .upload-file-icon {
          font-size: 20px;
        }
        
        .upload-file-info {
          flex: 1;
        }
        
        .upload-file-name {
          font-size: 12px;
          color: white;
        }
        
        .upload-file-size {
          font-size: 10px;
          color: var(--dim);
        }
        
        .upload-file-remove {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 4px;
        }
        
        .upload-file-remove:hover {
          color: #ef4444;
        }
        
        .upload-metadata {
          display: grid;
          gap: 12px;
        }
        
        .upload-metadata-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .upload-metadata-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .upload-label {
          font-size: 11px;
          color: var(--dim);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .upload-input,
        .upload-select,
        .upload-textarea {
          padding: 8px 12px;
          background: rgba(0,0,0,.3);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 6px;
          color: white;
          font-size: 13px;
          outline: none;
          width: 100%;
        }
        
        .upload-input:focus,
        .upload-select:focus,
        .upload-textarea:focus {
          border-color: #3B82F6;
        }
        
        .upload-textarea {
          resize: vertical;
          min-height: 60px;
        }
        
        .upload-visibility-options {
          display: flex;
          gap: 12px;
        }
        
        .upload-radio {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text);
          cursor: pointer;
        }
        
        .upload-radio input[type="radio"] {
          accent-color: #3B82F6;
        }
        
        .upload-hint {
          font-size: 10px;
          color: var(--dim);
          margin-top: 2px;
        }
        
        .upload-capture-area {
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 8px;
          padding: 12px;
          min-height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .capture-preview {
          position: relative;
          width: 100%;
          max-height: 200px;
        }
        
        .capture-preview img {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 6px;
        }
        
        .remove-capture {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0,0,0,.7);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
        }
        
        .capture-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 20px;
          width: 100%;
        }
        
        .capture-upload-icon {
          color: #666;
        }
        
        .capture-upload-hint {
          font-size: 10px;
          color: var(--dim);
        }
        
        .upload-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(220,38,38,.15);
          border-radius: 6px;
          color: #ef4444;
          font-size: 12px;
          margin-top: 12px;
        }
        
        .upload-modal-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(255,255,255,.1);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .upload-btn {
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
        }
        
        .upload-btn-secondary {
          background: rgba(255,255,255,.05);
          color: var(--text);
        }
        
        .upload-btn-secondary:hover {
          background: rgba(255,255,255,.1);
        }
        
        .upload-btn-primary {
          background: #3B82F6;
          color: white;
        }
        
        .upload-btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .upload-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .upload-spinner {
          animation: spin 1s linear infinite;
          width: 16px;
          height: 16px;
        }
        
        @media (max-width: 768px) {
          .upload-metadata-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}