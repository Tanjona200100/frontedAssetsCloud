// components/AdminDashboard/AssetsPanel.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { LiaEyeSolid, LiaDownloadSolid, LiaTrashAltSolid, LiaLockSolid, LiaGlobeSolid, LiaImageSolid, LiaUserSolid, LiaFolderOpen, LiaTagSolid } from 'react-icons/lia';
import { PiCubeLight } from "react-icons/pi";
import { FaRegFile } from "react-icons/fa6";
import { RiDossierFill } from "react-icons/ri";
import { MdFilterList, MdClose, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import PreviewModal from './PreviewModal';
// Import du ModelViewer Babylon
import ModelViewer from '../../components/UserDashboard/ModelViewer';
import JSZip from 'jszip';

const API_BASE_URL = process.env.REACT_APP_API_URL;

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

// ============ FONCTIONS DE DÉTECTION DES FORMATS ============
const SUPPORTED_3D_FORMATS = [
  'glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds',
  'blend', 'ply', '3mf', 'amf', 'bvh', 'c4d', 'dxf',
  'iges', 'igs', 'jtl', 'jt', 'lwo', 'lws', 'lxo',
  'modo', 'ms3d', 'ndo', 'nff', 'off', 'pov', 'prc',
  'sldasm', 'sldprt', 'step', 'stp', 'usd', 'usda', 'usdc',
  'usdz', 'vrml', 'wrl', 'x3d', 'x3db', 'x3dv',
  'x_t', 'x_b', 'sat', 'sab', 'asm', 'neu', 'cgr'
];

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
         name?.includes('albedo');
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

// ============ PAGINATION COMPOSANT ============
function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage = 15, onLimitChange, isLoading = false }) {
  // Calcul du nombre total de pages effectif
  const effectiveTotalPages = totalPages > 0 ? totalPages : Math.ceil(totalItems / itemsPerPage);
  
  // Ne pas afficher la pagination si pas assez d'éléments
  if (totalItems === 0 || (effectiveTotalPages === 1 && totalItems <= itemsPerPage)) {
    return null;
  }

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= effectiveTotalPages; i++) {
      if (i === 1 || i === effectiveTotalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      flexWrap: 'wrap',
      gap: 12,
      background: 'rgba(0,0,0,0.2)'
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: 'var(--dim)',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {isLoading ? (
          <>
            <span className="spinner-small" style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              border: '2px solid rgba(59,130,246,0.2)',
              borderTop: '2px solid #3B82F6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span>Chargement...</span>
          </>
        ) : (
          <span>{totalItems > 0 ? `${startItem}–${endItem} / ${totalItems}` : '0 fichier'}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.06)',
            background: currentPage === 1 || isLoading ? 'transparent' : 'rgba(255,255,255,0.05)',
            color: currentPage === 1 || isLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
            cursor: currentPage === 1 || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 1 && !isLoading) {
              e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1 && !isLoading) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }
          }}
        >
          <MdChevronLeft size={18} />
        </button>

        {getVisiblePages().map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 12
            }}>
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => !isLoading && onPageChange(page)}
              disabled={isLoading}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: page === currentPage ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                background: page === currentPage ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: page === currentPage ? '#3B82F6' : 'rgba(255,255,255,0.6)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: page === currentPage ? 600 : 400,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (page !== currentPage && !isLoading) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== currentPage && !isLoading) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }
              }}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isLoading}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.06)',
            background: currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isLoading ? 'transparent' : 'rgba(255,255,255,0.05)',
            color: currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
            cursor: currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== effectiveTotalPages && effectiveTotalPages !== 0 && !isLoading) {
              e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== effectiveTotalPages && effectiveTotalPages !== 0 && !isLoading) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }
          }}
        >
          <MdChevronRight size={18} />
        </button>
      </div>

      {onLimitChange && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{
            fontSize: 10,
            color: 'var(--dim)'
          }}>
            Par page:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value);
              onLimitChange(newLimit);
            }}
            disabled={isLoading}
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 4,
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              outline: 'none',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}
    </div>
  );
}

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

const AssetsPanel = ({ searchQuery = '' }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
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
  
  // États pour le ModelViewer 3D
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  
  // États pour la popup ZIP
  const [showZipPopup, setShowZipPopup] = useState(false);
  const [zipFiles, setZipFiles] = useState([]);
  const [currentAssetId, setCurrentAssetId] = useState(null);
  const [currentAssetName, setCurrentAssetName] = useState('');

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

  // ============ FONCTIONS POUR LA GESTION DES ZIP ============

  // Fonction de téléchargement avec timeout
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

  // Extraction du contenu ZIP
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

  // Fonction pour analyser le contenu du ZIP
  const analyzeZipContent = async (assetId, token) => {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/assets/${assetId}/download`,
        {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        },
        30000
      );

      if (!response.ok) {
        if (response.status === 206) {
          console.warn('Erreur 206 (Partial Content) détectée, nouvelle tentative...');
          const response2 = await fetchWithTimeout(
            `${API_BASE_URL}/assets/${assetId}/download`,
            {
              method: 'GET',
              headers: { 
                'Authorization': `Bearer ${token}`
              }
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

  // Fonction pour ouvrir la popup ZIP
  const openZipPopup = async (asset) => {
    const token = localStorage.getItem('token');
    if (!token) { 
      alert('Connectez-vous'); 
      return; 
    }

    setLoading(true);
    setError(null);
    
    try {
      const files = await analyzeZipContent(asset.id, token);
      if (files && files.length > 0) {
        setZipFiles(files);
        setCurrentAssetId(asset.id);
        setCurrentAssetName(asset.title || asset.name);
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
      alert('Connectez-vous'); 
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

  // ============ FONCTION FETCH ASSETS CORRIGÉE ============
  const fetchAssets = useCallback(async (pageNum = page) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const buildQueryParams = (extra = {}) => {
        const params = new URLSearchParams();
        params.set('page', pageNum);
        params.set('limit', limit);

        if (filters.search) params.set('search', filters.search);
        if (filters.visibility) params.set('visibility', filters.visibility);
        if (filters.file_type) params.set('file_type', filters.file_type);
        if (filters.created_by) params.set('created_by', filters.created_by);
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);

        Object.entries(extra).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });

        return params.toString();
      };

      let url;
      if (filters.category && filters.project) {
        url = `/assets?${buildQueryParams({ category_id: filters.category, project_id: filters.project })}`;
      } else if (filters.category) {
        url = `/categories/${filters.category}/assets?${buildQueryParams()}`;
      } else if (filters.project) {
        url = `/projects/${filters.project}/assets?${buildQueryParams()}`;
      } else {
        url = `/assets?${buildQueryParams()}`;
      }

      console.log('🔍 Fetching assets from:', url); // Debug
      const data = await apiRequest(url);
      console.log('📦 Données reçues:', data); // Debug

      // Gestion des différentes structures de réponse possibles
      const assetsList = data.assets || data.data || [];
      const pagination = data.pagination || {};
      
      setAssets(assetsList);
      setTotalPages(pagination.totalPages || data.totalPages || Math.ceil((pagination.total || data.total || 0) / limit) || 1);
      setTotalAssets(pagination.total || data.total || 0);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur chargement assets:', err);
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, limit]); // ⚠️ page N'EST PAS dans les dépendances

  // ============ USEFFECT CORRIGÉ ============
  useEffect(() => {
    fetchAssets(page);
  }, [page]); // ⚠️ fetchAssets N'EST PAS dans les dépendances

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
        const response = await fetch(`${API_BASE_URL}/users/admin/users`, {
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
          const response = await fetch(`${API_BASE_URL}/users/admin/users`, {
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

  // === FONCTION POUR OUVRIR LE MODEL VIEWER 3D ===
  const openModelViewer = (asset) => {
    const token = localStorage.getItem('token');
    if (!token) { 
      alert('Connectez-vous pour visualiser ce modèle');
      return; 
    }

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

    setSelectedModel({ 
      id: asset.id, 
      name: fileName, 
      token, 
      ext: cleanExt, 
      asset 
    });
    setShowModelViewer(true);
  };

  // Supprimer un asset
  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      setDeletingId(assetToDelete.id);
      await apiRequest(`/assets/${assetToDelete.id}`, { method: 'DELETE' });

      setShowConfirmModal(false);
      setAssetToDelete(null);
      // Recharger la page actuelle après suppression
      await fetchAssets(page);
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Télécharger un asset
// Télécharger un asset
const handleDownload = async (asset) => {
  try {
    setDownloadingId(asset.id);
    const token = localStorage.getItem('token');

    // Construire le nom du fichier correctement
    let fileName = asset.title || asset.name || asset.file_name || 'fichier';
    
    // Ajouter l'extension si elle existe
    const ext = asset.ext || asset.file_ext || asset.extension;
    if (ext) {
      const cleanExt = ext.replace(/^\./, '').toLowerCase();
      // Vérifier si le nom a déjà l'extension
      if (!fileName.toLowerCase().endsWith(`.${cleanExt}`)) {
        fileName = `${fileName}.${cleanExt}`;
      }
    }

    console.log('Téléchargement:', fileName); // Pour déboguer

    const response = await fetch(`${API_BASE_URL}/assets/${asset.id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*' // Important pour les fichiers binaires
      }
    });

    if (!response.ok) {
      let errorMsg = 'Erreur téléchargement';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        errorMsg = `Erreur ${response.status}: ${response.statusText}`;
      }
      
      if (response.status === 404) {
        throw new Error('Fichier non trouvé sur le serveur');
      }
      if (response.status === 403) {
        throw new Error('Vous n\'avez pas la permission de télécharger ce fichier');
      }
      if (response.status === 401) {
        throw new Error('Session expirée, veuillez vous reconnecter');
      }
      throw new Error(errorMsg);
    }

    // Récupérer le nom du fichier depuis les headers si disponible
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, '');
      }
    }

    const blob = await response.blob();
    
    // Vérifier que le blob n'est pas vide
    if (blob.size === 0) {
      throw new Error('Le fichier téléchargé est vide');
    }
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer après un délai
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);

  } catch (err) {
    console.error('Erreur téléchargement détaillée:', err);
    alert('Erreur lors du téléchargement: ' + err.message);
  } finally {
    setDownloadingId(null);
  }
};

  // === FONCTION DE VISUALISATION ===
  const handleView = (asset) => {
    if (isZipFile(asset)) {
      openZipPopup(asset);
      return;
    }

    if (is3DModel(asset)) {
      openModelViewer(asset);
    } else {
      setPreviewAsset(asset);
      setShowPreviewModal(true);
    }
  };

  // Fonction de téléchargement pour le modal
  const handleDownloadFromModal = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      handleDownload(asset);
    }
  };

  // ============ GESTIONNAIRES DE PAGINATION CORRIGÉS ============
  const handlePageChange = (newPage) => {
    console.log('📄 Changement de page vers:', newPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // Le useEffect avec [page] va déclencher le rechargement
    }
  };

  const handleLimitChange = (newLimit) => {
    console.log('📏 Changement de limite vers:', newLimit);
    setLimit(newLimit);
    setPage(1); // Reset à la page 1
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

  // Chargement initial
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
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="image">🖼️ Images</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="video">🎬 Vidéos</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="3d_model">🎮 Modèles 3D</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="archive">📦 Archives</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="document">📄 Documents</option>
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="audio">🎵 Audio</option>
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
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Tous</option>
                {users.map(user => (
                  <option style={{ background: 'rgba(0,0,0)', color: 'white' }} key={user.id} value={user.id}>
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
            const isDeleting = deletingId === asset.id;
            const isDownloading = downloadingId === asset.id;
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
                  onClick={() => handleView(asset)}
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
                          <div style={{ fontSize: 64, marginBottom: 8 }}>📦</div>
                          <div style={{ fontSize: 12, color: '#f59e0b' }}>Archive 3D</div>
                          <div style={{ fontSize: 10, color: '#666' }}>Contient un modèle 3D</div>
                        </div>
                        <div style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          background: 'rgba(0,0,0,.7)',
                          backdropFilter: 'blur(4px)',
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11,
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
                      </>
                    ) : (
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
                      onClick={() => handleView(asset)}
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
                      {isZIP ? '📂 Explorer' : is3D ? '3D Viewer' : 'Preview'}
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

        {/* ============ PAGINATION ============ */}
        {(totalPages > 1 || totalAssets > limit) && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalAssets}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            isLoading={loading}
          />
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

      {/* Preview Modal pour les fichiers non-3D */}
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

      {/* ModelViewer 3D pour les modèles 3D */}
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

        .spinner-small {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(59,130,246,0.2);
          border-top: 2px solid #3B82F6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </>
  );
};

export default AssetsPanel;