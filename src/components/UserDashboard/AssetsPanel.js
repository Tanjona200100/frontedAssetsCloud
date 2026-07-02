// src/components/UserDashboard/AssetsPanel.jsx
import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserContext } from '../../pages/UserDashboard';
import ModelViewer from './ModelViewer';
import { LiaEyeSolid, LiaDownloadSolid, LiaTrashAltSolid, LiaUploadSolid, LiaLockSolid, LiaGlobeSolid, LiaImageSolid, LiaUserSolid, LiaFolderOpen, LiaTagSolid, LiaEditSolid } from 'react-icons/lia';
import { PiCubeLight } from "react-icons/pi";
import { FaRegFile } from "react-icons/fa6";
import { RiDossierFill } from "react-icons/ri";
import { MdSearch, MdClose, MdFilterList } from 'react-icons/md';
import JSZip from 'jszip';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL;

// ============ LISTE DES FORMATS 3D ============
const SUPPORTED_3D_FORMATS = [
  'glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds',
  'blend', 'ply', '3mf', 'amf', 'bvh', 'c4d', 'dxf',
  'iges', 'igs', 'jtl', 'jt', 'lwo', 'lws', 'lxo',
  'modo', 'ms3d', 'ndo', 'nff', 'off', 'pov', 'prc',
  'sldasm', 'sldprt', 'step', 'stp', 'usd', 'usda', 'usdc',
  'usdz', 'vrml', 'wrl', 'x3d', 'x3db', 'x3dv',
  'x_t', 'x_b', 'sat', 'sab', 'asm', 'neu', 'cgr'
];

const VIEWABLE_3D_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'ply', '3mf'];

// ============ FONCTIONS UTILITAIRES ============

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

const getUserData = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) return JSON.parse(storedUser);
  } catch (e) {
    console.error('Erreur lors du parsing user:', e);
  }
  return {};
};

// ============ FONCTIONS DE DÉTECTION ============

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
    'dds', 'exr', 'hdr', 'gif', 'psd', 'ai', 'svg',
    'raw', 'r3d', 'arw', 'cr2', 'cr3', 'nef', 'pef'
  ];
  
  return textureExtensions.includes(ext) || 
         name?.includes('texture') || 
         name?.includes('normal') || 
         name?.includes('rough') ||
         name?.includes('metal') ||
         name?.includes('ao') ||
         name?.includes('diffuse') ||
         name?.includes('albedo') ||
         name?.includes('displacement') ||
         name?.includes('height') ||
         name?.includes('bump') ||
         name?.includes('emissive') ||
         name?.includes('opacity') ||
         name?.includes('alpha') ||
         name?.includes('specular') ||
         name?.includes('glossiness');
};

const isMaterialFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const name = asset.name?.toLowerCase();
  const materialExtensions = ['mtl', 'mat'];
  
  return materialExtensions.includes(ext) || 
         name?.includes('material') || 
         name?.includes('mtl');
};

const getFileCategory = (asset) => {
  if (isZipFile(asset)) return 'archive';
  if (is3DModel(asset)) return '3d_model';
  if (isTextureFile(asset)) return 'texture';
  if (isMaterialFile(asset)) return 'material';
  return 'other';
};

const getFileIcon = (asset) => {
  const category = getFileCategory(asset);
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
  switch (category) {
    case 'archive': return '#f59e0b';
    case '3d_model': return '#10b981';
    case 'texture': return '#3B82F6';
    case 'material': return '#8B5CF6';
    default: return '#666';
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

// ============ COMPOSANT ZIP CONTENT POPUP ============
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

// ============ COMPOSANT PRINCIPAL ============

export default function AssetsPanel({ searchQuery = '' }) {
  const { role, openPreview } = useContext(UserContext);
  const isGfx = role === 'gfx';

  const userData = getUserData();
  const isAdmin = userData?.role === 'admin' || userData?.is_admin === true;
  const currentUserId = userData?.id || userData?.user_id || getUserIdFromToken();

  // États principaux
  const [allAssets, setAllAssets] = useState([]); // Tous les assets chargés
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination - 4 colonnes x 3 lignes = 12 éléments par page
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Filtres
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

  // Upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadCategories, setUploadCategories] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadCapture, setUploadCapture] = useState(null);
  const [uploadCapturePreview, setUploadCapturePreview] = useState(null);
  const [uploadTriangleCount, setUploadTriangleCount] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Delete
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

  // Edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState('private');
  const [editCategory, setEditCategory] = useState('');
  const [editProject, setEditProject] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editing, setEditing] = useState(false);

  // 3D Viewer
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [hoveredAssetId, setHoveredAssetId] = useState(null);

  // Dropdowns
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);

  // ZIP Popup
  const [showZipPopup, setShowZipPopup] = useState(false);
  const [zipFiles, setZipFiles] = useState([]);
  const [currentAssetId, setCurrentAssetId] = useState(null);

  // ============ SYNC SEARCH ============
  useEffect(() => {
    if (searchQuery !== filters.search) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
      setCurrentPage(1);
    }
  }, [searchQuery]);

  // ============ PERMISSIONS ============
  const canDeleteAsset = (asset) => {
    if (isAdmin) return true;
    if (asset.created_by === currentUserId) return true;
    if (asset.uploaded_by === currentUserId) return true;
    if (asset.user_id === currentUserId) return true;
    return false;
  };

  const canEditAsset = (asset) => canDeleteAsset(asset);

  const canViewAsset = (asset) => {
    if (isAdmin) return true;
    if (asset.visibility === 'public') return true;
    if (asset.created_by === currentUserId) return true;
    if (asset.uploaded_by === currentUserId) return true;
    if (asset.user_id === currentUserId) return true;
    return false;
  };

  // ============ FETCH ALL ASSETS ============
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      // On charge tous les assets (pas de limite)
      params.append('limit', 9999);

      if (filters.search) params.append('search', filters.search);
      if (filters.visibility) params.append('visibility', filters.visibility);
      if (filters.file_type) params.append('file_type', filters.file_type);
      if (filters.created_by) params.append('created_by', filters.created_by);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.category) params.append('category_id', filters.category);
      if (filters.project) params.append('project_id', filters.project);

      const url = `${API_BASE_URL}/assets?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Non autorisé');
        if (response.status === 404) throw new Error('Ressource introuvable');
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      const rawAssetsData = data.data || data.assets || [];
      
      // Filtrer les assets que l'utilisateur peut voir
      const assetsData = rawAssetsData.filter(canViewAsset);
      const hiddenCount = rawAssetsData.length - assetsData.length;
      if (hiddenCount > 0) {
        console.warn(`${hiddenCount} asset(s) masqué(s) côté client.`);
      }

      setAllAssets(assetsData);
      
      // Réinitialiser à la page 1 si on change de filtre
      setCurrentPage(1);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ============ FETCH DROPDOWNS ============
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/simple`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erreur chargement projets');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Erreur fetchProjects:', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erreur chargement catégories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Erreur fetchCategories:', err);
    }
  }, []);

  // ============ ZIP UTILITIES ============
  const fetchWithTimeout = async (url, options, timeout = 30000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Le téléchargement a expiré. Veuillez réessayer.');
      }
      throw error;
    }
  };

  const extractZipContent = async (blob) => {
    if (!blob || blob.size === 0) {
      throw new Error('Le fichier ZIP est vide');
    }

    try {
      const zip = await JSZip.loadAsync(blob);
      const files = [];
      zip.forEach((relativePath, file) => {
        if (!file.dir) {
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
        }
      });
      
      if (files.length === 0) {
        throw new Error('Le ZIP ne contient aucun fichier');
      }
      return files;
    } catch (error) {
      console.error('Erreur extraction ZIP:', error);
      if (error.message.includes('invalid') || error.message.includes('corrupt')) {
        throw new Error('Le fichier ZIP est corrompu ou invalide');
      }
      throw error;
    }
  };

  const analyzeZipContent = async (assetId, token) => {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/assets/${assetId}/download`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        },
        30000
      );

      if (!response.ok) {
        if (response.status === 206) {
          const response2 = await fetchWithTimeout(
            `${API_BASE_URL}/assets/${assetId}/download`,
            {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` }
            },
            30000
          );
          if (!response2.ok) {
            throw new Error(`HTTP ${response2.status} - ${response2.statusText}`);
          }
          const blob = await response2.blob();
          return await extractZipContent(blob);
        }
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      return await extractZipContent(blob);
    } catch (error) {
      console.error('Erreur analyse ZIP:', error);
      throw error;
    }
  };

  const openZipPopup = async (asset) => {
    const token = localStorage.getItem('token');
    if (!token) { 
      setError('Connectez-vous'); 
      return; 
    }

    setLoading(true);
    setError(null);
    
    try {
      const files = await analyzeZipContent(asset.id, token);
      if (files && files.length > 0) {
        setZipFiles(files);
        setCurrentAssetId(asset.id);
        setShowZipPopup(true);
      } else {
        setError('Le ZIP ne contient aucun fichier');
      }
    } catch (err) {
      console.error('Erreur analyse ZIP:', err);
      if (err.message.includes('206') || err.message.includes('Partial')) {
        setError('Erreur de téléchargement partiel. Veuillez réessayer.');
      } else if (err.message.includes('corrompu') || err.message.includes('invalide')) {
        setError('Le fichier ZIP est corrompu ou invalide.');
      } else if (err.message.includes('expiré')) {
        setError('Le téléchargement a expiré. Veuillez réessayer.');
      } else {
        setError(`Erreur: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectZipFile = (file) => {
    setShowZipPopup(false);
    const token = localStorage.getItem('token');
    if (!token) { 
      setError('Connectez-vous'); 
      return; 
    }

    const asset = allAssets.find(a => a.id === currentAssetId);
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

  // ============ UPLOAD ============
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
      if (selectedProject) formData.append('project_id', selectedProject);
      if (selectedCategory) formData.append('categories', selectedCategory);
      
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

  // ============ DELETE ============
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

  // ============ EDIT ============
  const openEditModal = (asset) => {
    setAssetToEdit(asset);
    setEditTitle(asset.title || asset.name || '');
    setEditDescription(asset.description || '');
    setEditVisibility(asset.visibility || 'private');
    setEditCategory(asset.category_id || '');
    setEditProject(asset.project_id || '');
    setEditTags(Array.isArray(asset.tags) ? asset.tags.join(', ') : (asset.tags || ''));
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setAssetToEdit(null);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!assetToEdit) return;

    setEditing(true);
    setError(null);

    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        visibility: editVisibility,
        category_id: editCategory || null,
        project_id: editProject || null,
        tags: editTags
          ? editTags.split(',').map(t => t.trim()).filter(Boolean)
          : []
      };

      const response = await fetch(`${API_BASE_URL}/assets/${assetToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error("Vous n'avez pas le droit de modifier ce fichier");
        throw new Error(`Erreur: ${response.status}`);
      }

      closeEditModal();
      await fetchAssets();
    } catch (err) {
      console.error('Erreur modification asset:', err);
      setError(`Modification échouée: ${err.message}`);
    } finally {
      setEditing(false);
    }
  };

  // ============ DOWNLOAD ============
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

  // ============ PREVIEW ============
  const openAssetPreview = (asset) => {
    if (isZipFile(asset)) {
      openZipPopup(asset);
      return;
    }

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

  // ============ FILTERS ============
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
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
    setCurrentPage(1);
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

  // ============ PAGINATION CLIENT ============
  // Calcul des assets paginés
  const totalAssets = allAssets.length;
  const totalPages = Math.ceil(totalAssets / ITEMS_PER_PAGE);
  
  // S'assurer que la page actuelle est valide
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (currentPage < 1 && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Extraire les assets de la page actuelle
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalAssets);
  const paginatedAssets = allAssets.slice(startIndex, endIndex);

  // ============ USE EFFECTS ============
  useEffect(() => {
    fetchAssets();
    fetchProjects();
    fetchCategories();
  }, [fetchAssets, fetchProjects, fetchCategories]);

  // ============ RENDER ============
  if (loading && allAssets.length === 0) {
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
              {totalPages > 1 && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>
                  • Page {currentPage}/{totalPages}
                </span>
              )}
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
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Toutes</option>
                {categories.map(cat => (
                  <option style={{ background: 'rgba(0,0,0)', color: 'white' }} key={cat.id} value={cat.id}>
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
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Tous</option>
                {projects.map(project => (
                  <option style={{ background: 'rgba(0,0,0)', color: 'white' }} key={project.id} value={project.id}>
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
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Tous</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="3d_model">🎮 Modèles 3D</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="archive">📦 Archives</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="image">🖼️ Images</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="video">🎬 Vidéos</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="audio">🎵 Audio</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="document">📄 Documents</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="other">📎 Autres</option>
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
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Toutes</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="public">🌍 Public</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="private">🔒 Privé</option>
              </select>
            </div>      
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 18px', background: 'rgba(220,38,38,.15)', color: '#ef4444', fontSize: 12, borderBottom: '1px solid rgba(220,38,38,.3)' }}>
            {error}
          </div>
        )}

        {/* Grille des assets - 4 colonnes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          padding: '18px'
        }}>
          {paginatedAssets.map((asset) => {
            const is3D = is3DModel(asset);
            const isZIP = isZipFile(asset);
            const isTexture = isTextureFile(asset);
            const isMaterial = isMaterialFile(asset);
            const isHovered = hoveredAssetId === asset.id;
            const canDelete = canDeleteAsset(asset);
            const canEdit = canEditAsset(asset);
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
                {/* Zone de preview */}
                <div
                  onClick={() => openAssetPreview(asset)}
                  style={{
                    height: 180,
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
                            e.target.parentElement.querySelector('.default-zip-preview').style.display = 'flex';
                          }}
                        />
                        <div className="default-zip-preview" style={{ display: 'none', textAlign: 'center' }}>
                          <div style={{ fontSize: 48, marginBottom: 4 }}>📦</div>
                          <div style={{ fontSize: 11, color: '#f59e0b' }}>Archive 3D</div>
                        </div>
                        <div style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'rgba(0,0,0,.7)',
                          backdropFilter: 'blur(4px)',
                          padding: '3px 8px',
                          borderRadius: 10,
                          fontSize: 10,
                          color: '#f59e0b',
                          border: '1px solid rgba(245,158,11,.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          zIndex: 2
                        }}>
                          📦 ZIP
                        </div>
                        {isHovered && (
                          <div style={{
                            position: 'absolute',
                            bottom: 12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,.8)',
                            padding: '4px 12px',
                            borderRadius: 16,
                            fontSize: 10,
                            color: '#10b981',
                            whiteSpace: 'nowrap',
                            zIndex: 2
                          }}>
                            📂 Explorer
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 4 }}>📦</div>
                        <div style={{ fontSize: 11, color: '#f59e0b' }}>Archive 3D</div>
                        {isHovered && (
                          <div style={{
                            position: 'absolute',
                            bottom: 12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,.8)',
                            padding: '4px 12px',
                            borderRadius: 16,
                            fontSize: 10,
                            color: '#10b981',
                            whiteSpace: 'nowrap',
                            zIndex: 2
                          }}>
                            📂 Explorer
                          </div>
                        )}
                      </div>
                    )
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
                          <div style={{ fontSize: 48, marginBottom: 4 }}><PiCubeLight /></div>
                          <div style={{ fontSize: 11, color: '#3b82f6' }}>Modèle 3D</div>
                        </div>
                        {isHovered && (
                          <div style={{
                            position: 'absolute',
                            bottom: 12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,.8)',
                            padding: '4px 12px',
                            borderRadius: 16,
                            fontSize: 10,
                            color: '#10b981',
                            whiteSpace: 'nowrap',
                            zIndex: 2
                          }}>
                            ✨ Visualiser
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 4 }}><PiCubeLight /></div>
                        <div style={{ fontSize: 11, color: '#3b82f6' }}>
                          Modèle 3D
                          {asset.ext && (
                            <span style={{ fontSize: 9, display: 'block', color: '#666' }}>
                              {asset.ext.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {isHovered && (
                          <div style={{
                            position: 'absolute',
                            bottom: 12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,.8)',
                            padding: '4px 12px',
                            borderRadius: 16,
                            fontSize: 10,
                            color: '#10b981',
                            whiteSpace: 'nowrap'
                          }}>
                            ✨ Visualiser
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
                        <div style={{ fontSize: 48, marginBottom: 4 }}>🖼️</div>
                        <div style={{ fontSize: 11, color: '#3B82F6' }}>Texture</div>
                      </div>
                    )
                  ) : isMaterial ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 48, marginBottom: 4 }}>📄</div>
                      <div style={{ fontSize: 11, color: '#8B5CF6' }}>Matériau</div>
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
                      <div style={{ fontSize: 48, opacity: 0.5 }}><FaRegFile /></div>
                    )
                  )}
                </div>

                {/* Informations */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 500, fontSize: 12, marginBottom: 2, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {asset.title || asset.name}
                  </div>
                  <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>
                    {formatSize(asset.file_size || asset.size)} • {formatDate(asset.created_at)}
                  </div>
                  
                  <div style={{ fontSize: 9, marginBottom: 6, color: getFileColor(asset) }}>
                    {getFileIcon(asset)} {fileCategory === '3d_model' ? 'Modèle 3D' : 
                       fileCategory === 'archive' ? 'Archive 3D' :
                       fileCategory === 'texture' ? 'Texture' :
                       fileCategory === 'material' ? 'Matériau' : 'Fichier'}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 3,
                    flexWrap: 'wrap',
                    marginBottom: 6
                  }}>
                    <span style={{
                      fontSize: 8,
                      background: asset.visibility === 'public' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)',
                      color: asset.visibility === 'public' ? '#10B981' : '#EF4444',
                      padding: '1px 6px',
                      borderRadius: 8
                    }}>
                      {asset.visibility === 'public' ? '🌍 Public' : '🔒 Privé'}
                    </span>
                    {isZIP && (
                      <span style={{
                        fontSize: 8,
                        background: 'rgba(245,158,11,.15)',
                        color: '#f59e0b',
                        padding: '1px 6px',
                        borderRadius: 8
                      }}>
                        📦 ZIP
                      </span>
                    )}
                    {is3D && !isZIP && (
                      <span style={{
                        fontSize: 8,
                        background: 'rgba(16,185,129,.15)',
                        color: '#10b981',
                        padding: '1px 6px',
                        borderRadius: 8
                      }}>
                        🎮 3D
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 4,
                    borderTop: '1px solid rgba(255,255,255,.06)',
                    paddingTop: 6
                  }}>
                    <button
                      onClick={() => openAssetPreview(asset)}
                      style={{
                        flex: 1,
                        background: is3D || isZIP ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.05)',
                        border: 'none',
                        padding: '4px 6px',
                        borderRadius: 4,
                        color: is3D || isZIP ? '#3B82F6' : '#666',
                        cursor: is3D || isZIP ? 'pointer' : 'default',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
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
                      <LiaEyeSolid size={12} />
                      {isZIP ? '📂' : 'Voir'}
                    </button>
                    <button
                      onClick={() => handleDownload(asset.id, asset.name)}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,.05)',
                        border: 'none',
                        padding: '4px 6px',
                        borderRadius: 4,
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                      title="Télécharger"
                    >
                      <LiaDownloadSolid size={12} />
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => openEditModal(asset)}
                        style={{
                          flex: 1,
                          background: 'rgba(59,130,246,.1)',
                          border: 'none',
                          padding: '4px 6px',
                          borderRadius: 4,
                          color: '#3B82F6',
                          cursor: 'pointer',
                          fontSize: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59,130,246,.1)'}
                        title="Modifier"
                      >
                        <LiaEditSolid size={12} />
                      </button>
                    )}
                    
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
                          padding: '4px 6px',
                          borderRadius: 4,
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.1)'}
                        title="Supprimer"
                      >
                        <LiaTrashAltSolid size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {allAssets.length === 0 && !loading && (
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

        {/* Pagination en bas */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderTop: '1px solid rgba(255,255,255,.06)',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 11, 
              color: 'var(--dim)'
            }}>
              {totalAssets > 0 ? (
                <>
                  {startIndex + 1} – {endIndex} / {totalAssets}
                  <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    (Page {currentPage}/{totalPages})
                  </span>
                </>
              ) : (
                '0 assets'
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Bouton Première page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,.06)',
                  background: 'transparent',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.3 : 0.7,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
                title="Première page"
              >
                «
              </button>

              {/* Bouton Précédent */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,.06)',
                  background: 'transparent',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.3 : 0.7,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  transition: 'all 0.2s'
                }}
                title="Page précédente"
              >
                ‹
              </button>

              {/* Numéros de page */}
              {(() => {
                const pageNumbers = [];
                const maxVisiblePages = 5;
                
                if (totalPages <= maxVisiblePages) {
                  for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                  }
                } else {
                  if (currentPage <= 3) {
                    for (let i = 1; i <= 5; i++) {
                      pageNumbers.push(i);
                    }
                    pageNumbers.push('...');
                    pageNumbers.push(totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pageNumbers.push(1);
                    pageNumbers.push('...');
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      pageNumbers.push(i);
                    }
                  } else {
                    pageNumbers.push(1);
                    pageNumbers.push('...');
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                      pageNumbers.push(i);
                    }
                    pageNumbers.push('...');
                    pageNumbers.push(totalPages);
                  }
                }
                return pageNumbers.map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--dim)',
                      fontSize: 12
                    }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: currentPage === pageNum ? '1px solid rgba(59,130,246,.4)' : '1px solid rgba(255,255,255,.06)',
                        background: currentPage === pageNum ? 'rgba(59,130,246,.15)' : 'transparent',
                        color: currentPage === pageNum ? '#3B82F6' : 'rgba(255,255,255,.7)',
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'all 0.2s',
                        fontWeight: currentPage === pageNum ? '600' : '400'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== pageNum) {
                          e.currentTarget.style.background = 'rgba(255,255,255,.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== pageNum) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                ));
              })()}

              {/* Bouton Suivant */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,.06)',
                  background: 'transparent',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.3 : 0.7,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  transition: 'all 0.2s'
                }}
                title="Page suivante"
              >
                ›
              </button>

              {/* Bouton Dernière page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,.06)',
                  background: 'transparent',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.3 : 0.7,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
                title="Dernière page"
              >
                »
              </button>

              {/* Sélecteur de page */}
              <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--dim)' }}>Page</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= totalPages) {
                      setCurrentPage(val);
                    }
                  }}
                  style={{
                    width: 44,
                    height: 28,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,.1)',
                    background: 'rgba(0,0,0,.3)',
                    color: 'white',
                    textAlign: 'center',
                    fontSize: 12,
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--dim)' }}>/ {totalPages}</span>
              </div>
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

      {/* Modal de modification d'asset */}
      {showEditModal && assetToEdit && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="upload-modal-container" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <div className="upload-modal-icon">
                <LiaEditSolid size={22} />
              </div>
              <div className="upload-modal-title-section">
                <h3 className="upload-modal-title">Modifier l'asset</h3>
                <p className="upload-modal-subtitle">{assetToEdit.title || assetToEdit.name}</p>
              </div>
              <button className="upload-modal-close" onClick={closeEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="upload-modal-body">
                <div className="upload-metadata">
                  <div className="upload-metadata-row">
                    <div className="upload-metadata-field">
                      <label className="upload-label">Titre</label>
                      <input type="text" className="upload-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titre de l'asset" />
                    </div>
                    <div className="upload-metadata-field">
                      <label className="upload-label">Tags (séparés par des virgules)</label>
                      <input type="text" className="upload-input" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="ex: personnage, arme, environnement" />
                    </div>
                  </div>
                  <div className="upload-metadata-row">
                    <div className="upload-metadata-field">
                      <label className="upload-label">Projet</label>
                      <select
                        className="upload-select"
                        value={editProject}
                        onChange={(e) => setEditProject(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: 'white', fontSize: 13 }}
                      >
                        <option value="">Aucun projet</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="upload-metadata-field">
                      <label className="upload-label">Catégorie</label>
                      <select
                        className="upload-select"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: 'white', fontSize: 13 }}
                      >
                        <option value="">Aucune catégorie</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.icon || '🏷️'} {category.display_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="upload-metadata-row">
                    <div className="upload-metadata-field">
                      <label className="upload-label">Description</label>
                      <textarea className="upload-textarea" rows="2" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description de l'asset" />
                    </div>
                    <div className="upload-metadata-field">
                      <label className="upload-label">Visibilité</label>
                      <div className="upload-visibility-options">
                        <label className="upload-radio"><input type="radio" value="public" checked={editVisibility === 'public'} onChange={(e) => setEditVisibility(e.target.value)} /><span><LiaGlobeSolid /> Public</span></label>
                        <label className="upload-radio"><input type="radio" value="private" checked={editVisibility === 'private'} onChange={(e) => setEditVisibility(e.target.value)} /><span><LiaLockSolid /> Privé</span></label>
                      </div>
                    </div>
                  </div>
                </div>
                {error && <div className="upload-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>{error}</div>}
              </div>
              <div className="upload-modal-footer">
                <button type="button" className="upload-btn upload-btn-secondary" onClick={closeEditModal}>Annuler</button>
                <button type="submit" className="upload-btn upload-btn-primary" disabled={editing}>
                  {editing ? 'Enregistrement...' : 'Enregistrer les modifications'}
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
        
        .modal-container {
          background: #0a0f1a;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          width: 90%;
          max-width: 450px;
          overflow: hidden;
        }

        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(255,255,255,.1);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .modal-btn {
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          border: none;
          transition: all 0.2s;
        }

        .modal-btn-cancel {
          background: rgba(255,255,255,.05);
          color: var(--text);
        }

        .modal-btn-cancel:hover {
          background: rgba(255,255,255,.1);
        }

        .modal-btn-delete {
          background: #ef4444;
          color: white;
        }

        .modal-btn-delete:hover {
          background: #dc2626;
        }
        
        /* Responsive */
        @media (max-width: 1200px) {
          .tbl-wrap > div:not(.tbl-top):not(.pag) {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        
        @media (max-width: 900px) {
          .tbl-wrap > div:not(.tbl-top):not(.pag) {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 600px) {
          .tbl-wrap > div:not(.tbl-top):not(.pag) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}