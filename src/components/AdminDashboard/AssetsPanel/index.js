// components/AdminDashboard/AssetsPanel/index.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { RiDossierFill } from 'react-icons/ri';
import JSZip from 'jszip';
import ModelViewer from '../../../components/UserDashboard/ModelViewer';
import PreviewModal from '../PreviewModal';
import AssetCard from './AssetCard';
import FilterBar from './FilterBar';
import Pagination from './Pagination';
import ConfirmModal from './ConfirmModal';
import MediaViewerPopup from './MediaViewerPopup';
import ZipContentPopup from './ZipContentPopup';
import { useFetchAssets, useFetchMetadata } from './hooks';
import { apiRequest, fetchWithTimeout } from './api';
import { API_BASE_URL } from './constants';
import { 
  isZipFile, 
  is3DModel, 
  isVideoFile, 
  isImageFile,
  getMediaContent
} from './utils';
import './AssetsPanel.css';

// La fonction extractZipContent est maintenant définie ici uniquement
// et non importée depuis utils.js
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

const AssetsPanel = ({ searchQuery = '' }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredAssetId, setHoveredAssetId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showZipPopup, setShowZipPopup] = useState(false);
  const [zipFiles, setZipFiles] = useState([]);
  const [currentAssetId, setCurrentAssetId] = useState(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
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

  const videoRefs = useRef({});
  const isMounted = useRef(true);

  const { assets, loading, error, totalPages, totalAssets, fetchAssets, setAssets } = useFetchAssets(filters, limit, page);
  const { projects, categories, users } = useFetchMetadata();

  // ============ GESTION DES FILTRES ============
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

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  // ============ PAGINATION ============
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // ============ SYNC SEARCH ============
  useEffect(() => {
    if (searchQuery !== filters.search) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
      setPage(1);
    }
  }, [searchQuery]);

  // ============ GESTION DU ZIP ============
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

  const openZipPopup = async (asset) => {
    const token = localStorage.getItem('token');
    if (!token) { 
      alert('Connectez-vous'); 
      return; 
    }

    try {
      const files = await analyzeZipContent(asset.id, token);
      if (files && files.length > 0) {
        setZipFiles(files);
        setCurrentAssetId(asset.id);
        setShowZipPopup(true);
      } else {
        alert('Le ZIP ne contient aucun fichier');
      }
    } catch (err) {
      console.error('Erreur analyse ZIP:', err);
      let errorMsg = 'Erreur lors de l\'analyse du ZIP';
      if (err.message.includes('206') || err.message.includes('Partial')) {
        errorMsg = 'Erreur de téléchargement partiel. Veuillez réessayer.';
      } else if (err.message.includes('corrompu') || err.message.includes('invalide')) {
        errorMsg = 'Le fichier ZIP est corrompu ou invalide.';
      } else if (err.message.includes('expiré')) {
        errorMsg = 'Le téléchargement a expiré. Veuillez réessayer.';
      }
      alert(errorMsg);
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

  // ============ ACTIONS ============
  const handleView = (asset) => {
    if (isZipFile(asset)) {
      openZipPopup(asset);
      return;
    }

    const mediaContent = getMediaContent(asset);
    if (mediaContent.type !== 'none' && mediaContent.url) {
      const fullUrl = mediaContent.url.startsWith('http') 
        ? mediaContent.url 
        : `${API_BASE_URL.replace('/api', '')}${mediaContent.url}`;
      setSelectedMedia({ asset, mediaUrl: fullUrl, mediaType: mediaContent.type });
      setShowMediaViewer(true);
      return;
    }

    if (is3DModel(asset)) {
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
    } else {
      setPreviewAsset(asset);
      setShowPreviewModal(true);
    }
  };

  const handleDownload = async (asset) => {
    try {
      setDownloadingId(asset.id);
      const token = localStorage.getItem('token');

      let fileName = asset.title || asset.name || asset.file_name || 'fichier';
      
      const ext = asset.ext || asset.file_ext || asset.extension;
      if (ext) {
        const cleanExt = ext.replace(/^\./, '').toLowerCase();
        if (!fileName.toLowerCase().endsWith(`.${cleanExt}`)) {
          fileName = `${fileName}.${cleanExt}`;
        }
      }

      const response = await fetch(`${API_BASE_URL}/assets/${asset.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
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

      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Le fichier téléchargé est vide');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

    } catch (err) {
      console.error('Erreur téléchargement:', err);
      alert('Erreur lors du téléchargement: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteClick = (asset) => {
    setAssetToDelete({ id: asset.id, name: asset.title || asset.name });
    setShowConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
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

  // ============ RENDER ============
  if (loading && assets.length === 0) {
    return (
      <div className="tbl-wrap" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--dim)' }}>Chargement des assets...</div>
      </div>
    );
  }

  return (
    <>
      {/* Media Viewer Popup */}
      {showMediaViewer && selectedMedia && (
        <MediaViewerPopup
          asset={selectedMedia.asset}
          mediaUrl={selectedMedia.mediaUrl}
          mediaType={selectedMedia.mediaType}
          onClose={() => {
            setShowMediaViewer(false);
            setSelectedMedia(null);
          }}
        />
      )}

      <div className="tbl-wrap">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          activeFiltersCount={activeFiltersCount}
          categories={categories}
          projects={projects}
          users={users}
        />

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
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              isHovered={hoveredAssetId === asset.id}
              onHover={setHoveredAssetId}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={handleDeleteClick}
              isDownloading={downloadingId === asset.id}
              isDeleting={deletingId === asset.id}
              videoRefs={videoRefs}
            />
          ))}
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

      {/* Preview Modal */}
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

      {/* ModelViewer 3D */}
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
      <ConfirmModal
        isOpen={showConfirmModal}
        assetName={assetToDelete?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowConfirmModal(false);
          setAssetToDelete(null);
        }}
        isDeleting={deletingId === assetToDelete?.id}
      />
    </>
  );
};

export default AssetsPanel;