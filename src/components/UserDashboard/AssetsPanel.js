// src/components/UserDashboard/AssetsPanel.jsx
import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserContext } from '../../pages/UserDashboard';
import ModelViewer from './ModelViewer';
import { LiaEyeSolid, LiaDownloadSolid, LiaTrashAltSolid, LiaUploadSolid, LiaLockSolid, LiaGlobeSolid, LiaImageSolid, LiaUserSolid, LiaFolderOpen, LiaTagSolid } from 'react-icons/lia';
import { PiCubeLight } from "react-icons/pi";
import { FaRegFile } from "react-icons/fa6";
import { RiDossierFill } from "react-icons/ri";
import { MdSearch, MdClose, MdFilterList } from 'react-icons/md';
import JSZip from 'jszip';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://10.5.0.2:5000/api';

// Liste complète des extensions 3D supportées
const SUPPORTED_3D_FORMATS = [
  // Formats standards
  'glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds',
  // Formats additionnels
  'blend', 'ply', '3mf', 'amf', 'bvh', 'c4d', 'dxf',
  'iges', 'igs', 'jtl', 'jt', 'lwo', 'lws', 'lxo',
  'modo', 'ms3d', 'ndo', 'nff', 'off', 'pov', 'prc',
  'sldasm', 'sldprt', 'step', 'stp', 'usd', 'usda', 'usdc',
  'usdz', 'vrml', 'wrl', 'x3d', 'x3db', 'x3dv',
  'x_t', 'x_b', 'sat', 'sab', 'asm', 'neu', 'cgr'
];

// Liste des formats 3D visualisables directement
const VIEWABLE_3D_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'ply', '3mf'];

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

// ============ FONCTIONS DE DÉTECTION DES FORMATS ============

const is3DModel = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  
  return SUPPORTED_3D_FORMATS.includes(ext) || 
         fileType === '3d_model' ||
         fileType === '3d' ||
         fileType === 'model' ||
         SUPPORTED_3D_FORMATS.some(format => name?.endsWith(`.${format}`));
};

const isViewable3D = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  return VIEWABLE_3D_FORMATS.includes(ext);
};

const isZipFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  
  return ext === 'zip' || 
         fileType === 'zip' || 
         fileType === 'archive' ||
         name?.endsWith('.zip') ||
         name?.endsWith('.rar') ||
         name?.endsWith('.7z');
};

const isTextureFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const name = asset.name?.toLowerCase();
  
  const textureExtensions = [
    'jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp', 'tiff', 
    'dds', 'exr', 'hdr', 'gif', 'psd', 'ai', 'svg'
  ];
  
  return textureExtensions.includes(ext);
};

const isMaterialFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  return ext === 'mtl' || ext === 'mat';
};

// ============ FORMAT DETECTION HELPERS ============

const getFileCategory = (asset) => {
  if (isZipFile(asset)) return 'archive';
  if (is3DModel(asset)) return '3d_model';
  if (isTextureFile(asset)) return 'texture';
  if (isMaterialFile(asset)) return 'material';
  return 'other';
};

const getFileIcon = (asset) => {
  const category = getFileCategory(asset);
  const ext = asset.ext?.toLowerCase().replace(/^\./, '') || '';
  
  switch (category) {
    case 'archive': return '📦';
    case '3d_model': return '🎮';
    case 'texture': return '🖼️';
    case 'material': return '📄';
    default: return '📄';
  }
};

const getFileColor = (asset) => {
  const category = getFileCategory(asset);
  const ext = asset.ext?.toLowerCase().replace(/^\./, '') || '';
  
  switch (category) {
    case 'archive': return '#f59e0b';
    case '3d_model': return '#10b981';
    case 'texture': return '#3B82F6';
    case 'material': return '#8B5CF6';
    default: return '#666';
  }
};

// ============ ZIP CONTENT POPUP ============
function ZipContentPopup({ files, onClose, onSelectFile }) {
  const groupedFiles = files.reduce((acc, file) => {
    const parts = file.path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'Racine';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {});

  const sortedFolders = Object.keys(groupedFiles).sort();

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      'glb': '🎮', 'gltf': '🎮', 'obj': '🎮', 'fbx': '🎮',
      'blend': '🎮', 'stl': '🎮', 'ply': '🎮', 'dae': '🎮',
      '3ds': '🎮', 'usd': '🎮', 'usdz': '🎮', 'usda': '🎮',
      'mtl': '📄', 'mat': '📄',
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'webp': '🖼️',
      'tga': '🖼️', 'bmp': '🖼️', 'tiff': '🖼️', 'dds': '🖼️',
      'exr': '🖼️', 'hdr': '🖼️',
      'txt': '📝', 'json': '📋', 'xml': '📋'
    };
    return iconMap[ext] || '📄';
  };

  const getFileColor = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const modelExts = ['glb', 'gltf', 'obj', 'fbx', 'blend', 'stl', 'ply', 'dae', '3ds', 'usd', 'usdz'];
    const textureExts = ['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp', 'tiff', 'dds', 'exr', 'hdr'];
    
    if (modelExts.includes(ext)) return '#10b981';
    if (textureExts.includes(ext)) return '#3B82F6';
    if (ext === 'mtl' || ext === 'mat') return '#8B5CF6';
    return '#666';
  };

  const isModelFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return SUPPORTED_3D_FORMATS.includes(ext);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: '#0a0f1a',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        width: '90%',
        maxWidth: 800,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 18 }}>
              📦 Contenu du ZIP
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {files.length} fichier(s) trouvé(s)
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            fontSize: 24,
            cursor: 'pointer',
            width: 40,
            height: 40,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            ×
          </button>
        </div>

        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {sortedFolders.map((folder) => (
            <div key={folder} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 12,
                color: '#3B82F6',
                fontWeight: 600,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>📁</span>
                <span>{folder}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  ({groupedFiles[folder].length} fichier(s))
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 6
              }}>
                {groupedFiles[folder].map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 6,
                      cursor: isModelFile(file.filename) ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      border: '1px solid transparent'
                    }}
                    onClick={() => {
                      if (isModelFile(file.filename)) {
                        onSelectFile(file);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (isModelFile(file.filename)) {
                        e.currentTarget.style.background = 'rgba(16,185,129,0.15)';
                        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{getFileIcon(file.filename)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        color: '#fff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.filename}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <span style={{ color: getFileColor(file.filename) }}>
                          {file.extension.toUpperCase()}
                        </span>
                        <span>•</span>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        {isModelFile(file.filename) && (
                          <span style={{ color: '#10b981', fontSize: 9 }}>
                            🎯 Cliquer pour visualiser
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            💡 Cliquez sur un fichier modèle 3D pour le visualiser
          </span>
          <button onClick={onClose} style={{
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPanel({ searchQuery = '' }) {
  const { role, openPreview } = useContext(UserContext);
  const isGfx = role === 'gfx';

  const userData = getUserData();
  const isAdmin = userData?.role === 'admin' || userData?.is_admin === true;
  const currentUserId = userData?.id || userData?.user_id || getUserIdFromToken();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);

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
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // États pour la popup ZIP
  const [showZipPopup, setShowZipPopup] = useState(false);
  const [zipFiles, setZipFiles] = useState([]);
  const [currentAssetId, setCurrentAssetId] = useState(null);
  const [currentAssetName, setCurrentAssetName] = useState('');

  // Synchroniser avec la recherche de la topbar
  useEffect(() => {
    if (searchQuery !== filters.search) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
      setPage(1);
    }
  }, [searchQuery]);

  const canDeleteAsset = (asset) => {
    if (isAdmin) return true;
    if (asset.created_by === currentUserId) return true;
    if (asset.uploaded_by === currentUserId) return true;
    if (asset.user_id === currentUserId) return true;
    return false;
  };

  // Fonction pour analyser le contenu du ZIP
  const analyzeZipContent = async (assetId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);
      
      const files = [];
      zip.forEach((relativePath, file) => {
        const pathParts = relativePath.split('/');
        const filename = pathParts[pathParts.length - 1];
        const ext = filename.split('.').pop().toLowerCase();
        const folder = pathParts.slice(0, -1).join('/');

        files.push({
          filename: filename,
          path: relativePath,
          folder: folder || 'Racine',
          extension: ext,
          size: file._data?.uncompressedSize || 0
        });
      });

      return files;
    } catch (error) {
      console.error('Erreur analyse ZIP:', error);
      throw error;
    }
  };

  // Fonction pour ouvrir la popup ZIP
  const openZipPopup = async (asset) => {
    const token = localStorage.getItem('token');
    if (!token) { 
      setError('Connectez-vous'); 
      return; 
    }

    try {
      const files = await analyzeZipContent(asset.id, token);
      setZipFiles(files);
      setCurrentAssetId(asset.id);
      setCurrentAssetName(asset.title || asset.name);
      setShowZipPopup(true);
    } catch (err) {
      setError(`Erreur lors de l'analyse du ZIP: ${err.message}`);
    }
  };

  const handleSelectZipFile = (file) => {
    setShowZipPopup(false);
    
    const token = localStorage.getItem('token');
    if (!token) { 
      setError('Connectez-vous'); 
      return; 
    }

    const asset = assets.find(a => a.id === currentAssetId);
    if (!asset) return;

    setSelectedModel({ 
      id: currentAssetId, 
      name: file.filename,
      token, 
      ext: 'zip',
      asset: asset,
      selectedZipFile: file
    });
    setShowModelViewer(true);
  };

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);
      
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
    // Si c'est un ZIP, ouvrir la popup
    if (isZipFile(asset)) {
      openZipPopup(asset);
      return;
    }

    // Si c'est un modèle 3D (TOUS les formats 3D)
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

      // Si ce n'est pas un format directement visualisable, on essaie quand même
      // Le viewer Babylon.js gérera les formats supportés
      if (!cleanExt && asset.file_type === '3d_model') cleanExt = 'glb';

      let fileName = asset.title || asset.name || 'model';
      if (cleanExt && !fileName.toLowerCase().endsWith(`.${cleanExt}`)) {
        fileName = `${fileName}.${cleanExt}`;
      }

      console.log(`🔄 Ouverture du modèle 3D: ${fileName} (${cleanExt})`);

      setSelectedModel({ id: asset.id, name: fileName, token, ext: cleanExt, asset });
      setShowModelViewer(true);
    } else {
      // Pour les autres fichiers (images, vidéos, etc.)
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
  }, [fetchAssets, fetchProjects, fetchCategories]);

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
                <option value="3d_model">🎮 Modèles 3D</option>
                <option value="archive">📦 Archives</option>
                <option value="image">🖼️ Images</option>
                <option value="video">🎬 Vidéos</option>
                <option value="audio">🎵 Audio</option>
                <option value="document">📄 Documents</option>
                <option value="other">📎 Autres</option>
              </select>
            </div>

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
            const isZIP = isZipFile(asset);
            const isTexture = isTextureFile(asset);
            const isMaterial = isMaterialFile(asset);
            const isHovered = hoveredAssetId === asset.id;
            const canDelete = canDeleteAsset(asset);
            const fileCategory = getFileCategory(asset);

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
                  {isZIP ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 64, marginBottom: 8 }}>📦</div>
                      <div style={{ fontSize: 12, color: '#f59e0b' }}>Archive 3D</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Contient un modèle 3D</div>
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
                          📂 Explorer le contenu
                        </div>
                      )}
                    </div>
                  ) : is3D ? (
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
                        <div style={{ fontSize: 12, color: '#3b82f6' }}>
                          Modèle 3D
                          {asset.ext && (
                            <span style={{ fontSize: 10, display: 'block', color: '#666' }}>
                              {asset.ext.toUpperCase()}
                            </span>
                          )}
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
                            whiteSpace: 'nowrap'
                          }}>
                            ✨ Cliquer pour visualiser
                          </div>
                        )}
                      </div>
                    )
                  ) : isTexture ? (
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
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 64, marginBottom: 8 }}>🖼️</div>
                        <div style={{ fontSize: 12, color: '#3B82F6' }}>Texture</div>
                      </div>
                    )
                  ) : isMaterial ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 64, marginBottom: 8 }}>📄</div>
                      <div style={{ fontSize: 12, color: '#8B5CF6' }}>Matériau</div>
                    </div>
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
                  
                  {/* Indicateur de type avec icône */}
                  <div style={{ fontSize: 10, marginBottom: 10, color: getFileColor(asset) }}>
                    {getFileIcon(asset)} {fileCategory === '3d_model' ? 'Modèle 3D' : 
                       fileCategory === 'archive' ? 'Archive 3D' :
                       fileCategory === 'texture' ? 'Texture' :
                       fileCategory === 'material' ? 'Matériau' : 'Fichier'}
                    {fileCategory === '3d_model' && asset.ext && (
                      <span style={{ fontSize: 9, color: '#666', marginLeft: 4 }}>
                        ({asset.ext.toUpperCase()})
                      </span>
                    )}
                  </div>

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
                    {isZIP && (
                      <span style={{
                        fontSize: 9,
                        background: 'rgba(245,158,11,.15)',
                        color: '#f59e0b',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        📦 ZIP
                      </span>
                    )}
                    {is3D && !isZIP && (
                      <span style={{
                        fontSize: 9,
                        background: 'rgba(16,185,129,.15)',
                        color: '#10b981',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        🎮 3D
                      </span>
                    )}
                    {isTexture && (
                      <span style={{
                        fontSize: 9,
                        background: 'rgba(59,130,246,.15)',
                        color: '#3B82F6',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        🖼️ Texture
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
                        background: is3D || isZIP ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.05)',
                        border: 'none',
                        padding: '7px',
                        borderRadius: 6,
                        color: is3D || isZIP ? '#3B82F6' : '#666',
                        cursor: is3D || isZIP ? 'pointer' : 'default',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'background 0.2s',
                        opacity: is3D || isZIP ? 1 : 0.5
                      }}
                      onMouseEnter={(e) => {
                        if (is3D || isZIP) {
                          e.currentTarget.style.background = 'rgba(59,130,246,.25)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (is3D || isZIP) {
                          e.currentTarget.style.background = 'rgba(59,130,246,.15)';
                        }
                      }}
                    >
                      <LiaEyeSolid size={14} />
                      {isZIP ? '📂 Explorer' : is3D ? 'Preview 3D' : 'Aperçu'}
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

      {/* Popup ZIP */}
      {showZipPopup && (
        <ZipContentPopup 
          files={zipFiles} 
          onClose={() => setShowZipPopup(false)}
          onSelectFile={handleSelectZipFile}
        />
      )}

      {/* Modal d'upload multiple - garder le code existant */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>
          {/* ... contenu existant ... */}
        </div>
      )}

      {/* Modal de confirmation suppression - garder le code existant */}
      {showConfirmModal && assetToDelete && (
        <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>
          {/* ... contenu existant ... */}
        </div>
      )}

      {/* Vue 3D */}
      {showModelViewer && selectedModel && (
        <ModelViewer
          key={selectedModel.id + (selectedModel.selectedZipFile?.filename || '')}
          assetId={selectedModel.id}
          assetName={selectedModel.name}
          token={localStorage.getItem('token')}
          assetExt={selectedModel.ext}
          assetData={selectedModel.asset}
          selectedZipFile={selectedModel.selectedZipFile}
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
        
        /* ... styles existants ... */
      `}</style>
    </>
  );
}