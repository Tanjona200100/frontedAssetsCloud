// src/components/UserDashboard/AssetsPanel.jsx

import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserContext } from '../../../pages/UserDashboard';
import ModelViewer from '../ModelViewer';
import { LiaUploadSolid } from 'react-icons/lia';
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiXCircle, 
  FiInfo,
  FiFile,
  FiFolder,
  FiImage,
  FiVideo,
  FiBox,
  FiArchive,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiEye,
  FiFilter,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

// Import des assets
import { API_BASE_URL, ITEMS_PER_PAGE } from './assets/constants';
import { 
  getUserData, getUserIdFromToken, 
  is3DModel, isZipFile, isVideoFile, isImageFile,
  getMediaContent, canDeleteAsset, canEditAsset
} from './assets/utils';
import { 
  useAssets, useProjects, useCategories, 
  useFilters, usePagination, useUpload, 
  useEdit, useNotification, useDelete, 
  useZip, useMediaViewer, useModelViewer 
} from './assets/hooks';
import { styles } from './assets/styles';

// Import des composants
import NotificationPopup from './components/NotificationPopup';
import MediaViewerPopup from './components/MediaViewerPopup';
import ZipContentPopup from './components/ZipContentPopup';
import AssetGrid from './components/AssetGrid';
import AssetFilters from './components/AssetFilters';
import Pagination from './components/Pagination';
import UploadModal from './components/UploadModal';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import EditAssetModal from './modals/EditAssetModal';

export default function AssetsPanel({ searchQuery = '' }) {
  const { role, openPreview } = useContext(UserContext);
  const isGfx = role === 'gfx';

  const userData = getUserData();
  const isAdmin = userData?.role === 'admin' || userData?.is_admin === true;
  const currentUserId = userData?.id || userData?.user_id || getUserIdFromToken();

  // Hooks
  const { filters, setFilters, handleFilterChange, resetFilters, activeFiltersCount } = useFilters();
  const { allAssets, setAllAssets, loading, error, fetchAssets } = useAssets(filters);
  const { projects, fetchProjects } = useProjects();
  const { categories, fetchCategories } = useCategories();
  const { notification, showNotification, closeNotification } = useNotification();
  const { showMediaViewer, setShowMediaViewer, selectedMedia, setSelectedMedia } = useMediaViewer();
  const { showModelViewer, setShowModelViewer, selectedModel, setSelectedModel } = useModelViewer();
  const upload = useUpload();
  const edit = useEdit();
  const deleteState = useDelete();
  const zip = useZip();

  // États locaux
  const [hoveredAssetId, setHoveredAssetId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const videoRefs = useRef({});

  // Pagination
  const totalAssets = allAssets.length;
  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex } = usePagination(totalAssets, ITEMS_PER_PAGE);
  const paginatedAssets = allAssets.slice(startIndex, endIndex);

  // Sync search
  useEffect(() => {
    if (searchQuery !== filters.search) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
      setCurrentPage(1);
    }
  }, [searchQuery, filters.search, setFilters]);

  // Fetch data
  useEffect(() => {
    fetchAssets();
    fetchProjects();
    fetchCategories();
  }, [fetchAssets, fetchProjects, fetchCategories]);

  // Permissions
  const canDeleteAssetFn = useCallback((asset) => {
    return canDeleteAsset(asset, isAdmin, currentUserId);
  }, [isAdmin, currentUserId]);

  const canEditAssetFn = useCallback((asset) => {
    return canEditAsset(asset, isAdmin, currentUserId);
  }, [isAdmin, currentUserId]);

  // Upload
  const handleMultipleUpload = async (event) => {
    event.preventDefault();

    if (upload.selectedFiles.length === 0) {
      showNotification('warning', 'Aucun fichier sélectionné', 'Veuillez sélectionner au moins un fichier');
      return;
    }

    if (upload.selectedFiles.length > 10) {
      showNotification('warning', 'Trop de fichiers', 'Maximum 10 fichiers par upload');
      return;
    }

    upload.setUploading(true);

    try {
      const formData = new FormData();

      upload.selectedFiles.forEach(file => {
        formData.append('assets', file);
      });

      if (upload.uploadCapture) {
        formData.append('captures', upload.uploadCapture);
      }

      if (upload.uploadVisibility) formData.append('visibility', upload.uploadVisibility);
      if (upload.uploadCategories) formData.append('categories', upload.uploadCategories);
      if (upload.uploadTags) formData.append('tags', upload.uploadTags);
      if (upload.uploadTitle) formData.append('default_title', upload.uploadTitle);
      if (upload.uploadDescription) formData.append('default_description', upload.uploadDescription);
      if (upload.uploadTriangleCount) formData.append('triangle_counts', upload.uploadTriangleCount);
      if (upload.selectedProject) formData.append('project_id', upload.selectedProject);
      if (upload.selectedCategory) formData.append('categories', upload.selectedCategory);
      
      const response = await fetch(`${API_BASE_URL}/assets/upload-multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload échoué (${response.status})`);
      }

      await response.json();
      
      upload.resetUploadForm();
      upload.setShowUploadModal(false);
      await fetchAssets();
      
      showNotification(
        'success',
        'Upload réussi',
        `${upload.selectedFiles.length} fichier(s) ont été uploadés avec succès.`
      );
    } catch (err) {
      console.error('Erreur upload multiple:', err);
      showNotification(
        'error',
        'Échec de l\'upload',
        err.message || 'Une erreur est survenue lors de l\'upload'
      );
    } finally {
      upload.setUploading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteState.assetToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/assets/${deleteState.assetToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur: ${response.status}`);
      }

      const deletedName = deleteState.assetToDelete.name;
      deleteState.setShowConfirmModal(false);
      deleteState.setAssetToDelete(null);
      await fetchAssets();
      
      showNotification(
        'success',
        'Suppression réussie',
        `L'asset "${deletedName}" a été supprimé définitivement.`
      );
    } catch (err) {
      console.error('Erreur suppression:', err);
      showNotification(
        'error',
        'Échec de la suppression',
        err.message || "Vous n'avez pas le droit de supprimer ce fichier"
      );
      deleteState.setShowConfirmModal(false);
    }
  };

  // Edit
  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!edit.assetToEdit) return;

    edit.setEditing(true);

    try {
      const payload = {
        title: edit.editTitle,
        description: edit.editDescription,
        visibility: edit.editVisibility,
        category_id: edit.editCategory || null,
        project_id: edit.editProject || null,
        tags: edit.editTags
          ? edit.editTags.split(',').map(t => t.trim()).filter(Boolean)
          : []
      };

      const response = await fetch(`${API_BASE_URL}/assets/${edit.assetToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error("Vous n'avez pas le droit de modifier ce fichier");
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur: ${response.status}`);
      }

      edit.closeEditModal();
      await fetchAssets();
      
      showNotification(
        'success',
        'Mise à jour réussie',
        `L'asset "${edit.assetToEdit.title || edit.assetToEdit.name}" a été mis à jour avec succès.`
      );
    } catch (err) {
      console.error('Erreur modification asset:', err);
      showNotification(
        'error',
        'Échec de la mise à jour',
        err.message || 'Une erreur est survenue lors de la mise à jour'
      );
    } finally {
      edit.setEditing(false);
    }
  };

  // Download
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
        
        if (response.status === 404) throw new Error('Fichier non trouvé');
        if (response.status === 403) throw new Error('Permission refusée');
        if (response.status === 401) throw new Error('Session expirée');
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
      showNotification(
        'error',
        'Échec du téléchargement',
        err.message || 'Une erreur est survenue lors du téléchargement'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // ZIP
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
      const JSZip = (await import('jszip')).default;
      const zipObj = await JSZip.loadAsync(blob);
      const files = [];
      zipObj.forEach((relativePath, file) => {
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
      showNotification('warning', 'Non connecté', 'Veuillez vous connecter');
      return; 
    }

    try {
      const files = await analyzeZipContent(asset.id, token);
      if (files && files.length > 0) {
        zip.setZipFiles(files);
        zip.setCurrentAssetId(asset.id);
        zip.setShowZipPopup(true);
      } else {
        showNotification('warning', 'ZIP vide', 'Le ZIP ne contient aucun fichier');
      }
    } catch (err) {
      console.error('Erreur analyse ZIP:', err);
      showNotification('error', 'Erreur ZIP', err.message);
    }
  };

  const handleSelectZipFile = (file) => {
    zip.setShowZipPopup(false);
    const token = localStorage.getItem('token');
    if (!token) { 
      showNotification('warning', 'Non connecté', 'Veuillez vous connecter');
      return; 
    }

    const asset = allAssets.find(a => a.id === zip.currentAssetId);
    if (!asset) return;

    setSelectedModel({ 
      id: zip.currentAssetId, 
      name: file.filename,
      token, 
      ext: 'zip',
      asset: asset,
      selectedZipFile: file
    });
    setShowModelViewer(true);
  };

  // Preview
  const openAssetPreview = (asset) => {
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
        showNotification('warning', 'Non connecté', 'Veuillez vous connecter pour visualiser');
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

      setSelectedModel({ id: asset.id, name: fileName, token, ext: cleanExt, asset });
      setShowModelViewer(true);
    } else {
      openPreview(asset.title || asset.name);
    }
  };

  // Render
  if (loading && allAssets.length === 0) {
    return (
      <div className="tbl-wrap" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden', padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--dim)' }}>Chargement des assets...</div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>

      {/* Notifications */}
      <NotificationPopup notification={notification} onClose={closeNotification} />

      {/* Media Viewer */}
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

      {/* ZIP Popup */}
      {zip.showZipPopup && (
        <ZipContentPopup 
          files={zip.zipFiles} 
          onClose={() => zip.setShowZipPopup(false)}
          onSelectFile={handleSelectZipFile}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        showUploadModal={upload.showUploadModal}
        setShowUploadModal={upload.setShowUploadModal}
        uploading={upload.uploading}
        selectedFiles={upload.selectedFiles}
        uploadTitle={upload.uploadTitle}
        setUploadTitle={upload.setUploadTitle}
        uploadDescription={upload.uploadDescription}
        setUploadDescription={upload.setUploadDescription}
        uploadVisibility={upload.uploadVisibility}
        setUploadVisibility={upload.setUploadVisibility}
        uploadTriangleCount={upload.uploadTriangleCount}
        setUploadTriangleCount={upload.setUploadTriangleCount}
        selectedProject={upload.selectedProject}
        setSelectedProject={upload.setSelectedProject}
        selectedCategory={upload.selectedCategory}
        setSelectedCategory={upload.setSelectedCategory}
        uploadCapturePreview={upload.uploadCapturePreview}
        uploadCapture={upload.uploadCapture}
        setUploadCapture={upload.setUploadCapture}
        setUploadCapturePreview={upload.setUploadCapturePreview}
        handleFileSelect={upload.handleFileSelect}
        removeFile={upload.removeFile}
        handleCaptureSelect={upload.handleCaptureSelect}
        handleSubmit={handleMultipleUpload}
        resetUploadForm={upload.resetUploadForm}
        projects={projects}
        categories={categories}
        showNotification={showNotification}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        showConfirmModal={deleteState.showConfirmModal}
        assetToDelete={deleteState.assetToDelete}
        onCancel={() => {
          deleteState.setShowConfirmModal(false);
          deleteState.setAssetToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      {/* Edit Modal */}
      <EditAssetModal
        showEditModal={edit.showEditModal}
        assetToEdit={edit.assetToEdit}
        editTitle={edit.editTitle}
        setEditTitle={edit.setEditTitle}
        editDescription={edit.editDescription}
        setEditDescription={edit.setEditDescription}
        editVisibility={edit.editVisibility}
        setEditVisibility={edit.setEditVisibility}
        editCategory={edit.editCategory}
        setEditCategory={edit.setEditCategory}
        editProject={edit.editProject}
        setEditProject={edit.setEditProject}
        editTags={edit.editTags}
        setEditTags={edit.setEditTags}
        editing={edit.editing}
        onClose={edit.closeEditModal}
        onSubmit={handleEditSubmit}
        projects={projects}
        categories={categories}
      />

      {/* Panel principal */}
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

            <AssetFilters
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              filters={filters}
              handleFilterChange={handleFilterChange}
              resetFilters={resetFilters}
              activeFiltersCount={activeFiltersCount}
              categories={categories}
              projects={projects}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => upload.setShowUploadModal(true)}
              style={{ background: '#3B82F6', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LiaUploadSolid size={16} />
              Upload
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 18px', background: 'rgba(220,38,38,.15)', color: '#ef4444', fontSize: 12, borderBottom: '1px solid rgba(220,38,38,.3)' }}>
            <FiAlertTriangle style={{ display: 'inline-block', marginRight: 6 }} />
            {error}
          </div>
        )}

        {/* Grille des assets */}
        <AssetGrid
          assets={paginatedAssets}
          downloadingId={downloadingId}
          onOpenPreview={openAssetPreview}
          onDownload={handleDownload}
          onEdit={edit.openEditModal}
          onDelete={(asset) => {
            deleteState.setAssetToDelete({ id: asset.id, name: asset.title || asset.name });
            deleteState.setShowConfirmModal(true);
          }}
          canDelete={canDeleteAssetFn}
          canEdit={canEditAssetFn}
          hoveredAssetId={hoveredAssetId}
          setHoveredAssetId={setHoveredAssetId}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            totalItems={totalAssets}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        )}
      </div>

      {/* Model Viewer */}
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
    </>
  );
}