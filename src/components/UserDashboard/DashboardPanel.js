// src/components/UserDashboard/DashboardPanel.jsx
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserContext } from '../../pages/UserDashboard';
import ModelViewer from '../UserDashboard/ModelViewer';
import JSZip from 'jszip';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// ============ HOOKS PERSONNALISÉS (intégrés directement) ============

// Hook pour la gestion du ModelViewer
const useModelViewer = () => {
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  const closeModelViewer = useCallback(() => {
    setShowModelViewer(false);
    setSelectedModel(null);
  }, []);

  return {
    showModelViewer,
    setShowModelViewer,
    selectedModel,
    setSelectedModel,
    closeModelViewer
  };
};

// Hook pour la gestion du Media Viewer
const useMediaViewer = () => {
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const closeMediaViewer = useCallback(() => {
    setShowMediaViewer(false);
    setSelectedMedia(null);
  }, []);

  return {
    showMediaViewer,
    setShowMediaViewer,
    selectedMedia,
    setSelectedMedia,
    closeMediaViewer
  };
};

// Hook pour la gestion du ZIP
const useZip = () => {
  const [showZipPopup, setShowZipPopup] = useState(false);
  const [zipFiles, setZipFiles] = useState([]);
  const [currentAssetId, setCurrentAssetId] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetZip = useCallback(() => {
    setZipFiles([]);
    setCurrentAssetId(null);
    setShowZipPopup(false);
    setLoading(false);
  }, []);

  return {
    showZipPopup,
    setShowZipPopup,
    zipFiles,
    setZipFiles,
    currentAssetId,
    setCurrentAssetId,
    loading,
    setLoading,
    resetZip
  };
};

// ============ FONCTIONS UTILITAIRES ============

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

// Fonction fetch avec timeout
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

// Formater la taille des fichiers
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
};

// Formater la date
const formatDate = (dateString) => {
  if (!dateString) return 'Date inconnue';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return "Auj.";
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return `${date.getDate()} ${date.toLocaleString('fr', { month: 'short' })}`;
};

// Obtenir l'icône en fonction du type de fichier
const getFileIcon = (fileType, fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  
  if (fileType === 'image' || ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') return 'img';
  if (fileType === 'video' || ext === 'mp4' || ext === 'webm' || ext === 'mov') return 'vid';
  if (fileType === '3d_model' || ext === 'glb' || ext === 'obj' || ext === 'fbx' || ext === 'stl') return '3d';
  if (ext === 'psd') return 'psd';
  if (ext === 'ai') return 'ai';
  if (ext === 'zip' || ext === 'rar' || ext === '7z') return 'zip';
  if (ext === 'json') return 'json';
  return 'file';
};

// Obtenir l'extension en majuscules
const getFileExt = (fileName) => {
  return fileName?.split('.').pop()?.toUpperCase() || 'FILE';
};

// Détection des formats 3D
const SUPPORTED_3D_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds', 'ply'];

const is3DModel = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '') || asset.file_name?.split('.').pop()?.toLowerCase() || '';
  const fileType = asset.file_type?.toLowerCase();
  return SUPPORTED_3D_FORMATS.includes(ext) || fileType === '3d_model' || fileType === '3d' || fileType === 'model';
};

const isVideoFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '') || asset.file_name?.split('.').pop()?.toLowerCase() || '';
  const fileType = asset.file_type?.toLowerCase();
  return fileType === 'video' || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
};

const isImageFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '') || asset.file_name?.split('.').pop()?.toLowerCase() || '';
  const fileType = asset.file_type?.toLowerCase();
  return fileType === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'].includes(ext);
};

const isZipFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '') || asset.file_name?.split('.').pop()?.toLowerCase() || '';
  const fileType = asset.file_type?.toLowerCase();
  return ext === 'zip' || 
         fileType === 'zip' || 
         fileType === 'archive' ||
         asset.file_name?.endsWith('.zip') ||
         asset.file_name?.endsWith('.rar') ||
         asset.file_name?.endsWith('.7z');
};

// ============ VALIDATION FBX ============
const validateFBXContent = (arrayBuffer) => {
  try {
    const view = new Uint8Array(arrayBuffer);
    
    if (view.length < 30) {
      return { valid: false, reason: 'Fichier trop petit' };
    }
    
    const header = new TextDecoder('utf-8', { fatal: false }).decode(view.slice(0, 30));
    
    const isAsciiFBX = header.includes('FBX') || header.includes('Kaydara');
    const isBinaryFBX = view[0] === 0x28 && view[1] === 0x70 && view[2] === 0x6F;
    const isBinaryFBX2 = view[0] === 0x00 && view[1] === 0x1A && view[2] === 0x00;
    
    if (isAsciiFBX || isBinaryFBX || isBinaryFBX2) {
      return { valid: true, format: isAsciiFBX ? 'ascii' : 'binary' };
    }
    
    const textChunk = new TextDecoder('utf-8', { fatal: false }).decode(view.slice(0, 1000));
    if (textChunk.includes('FBX') || textChunk.includes('KAYDARA')) {
      return { valid: true, format: 'ascii' };
    }
    
    return { valid: false, reason: 'Format FBX non reconnu' };
  } catch (error) {
    return { valid: false, reason: error.message };
  }
};

// ============ COMPOSANT PRINCIPAL ============

export default function DashboardPanel() {
  const { role, config, openPreview } = useContext(UserContext);
  
  // États principaux
  const [dashboardData, setDashboardData] = useState({
    userAssets: [],
    totalAssets: 0,
    weeklyUploads: 0,
    usedStorage: 0,
    loading: true,
    error: null
  });
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Utilisation des hooks
  const modelViewer = useModelViewer();
  const mediaViewer = useMediaViewer();
  const zip = useZip();

  const isGfx = role === 'gfx';
  const storageLimit = 50;
  const storagePercent = Math.min(Math.round((dashboardData.usedStorage / storageLimit) * 100), 100);
  const freeStorage = Math.max(0, storageLimit - dashboardData.usedStorage);

  // ============ FONCTIONS POUR LE ZIP ============

  const extractZipContent = async (blob) => {
    if (!blob || blob.size === 0) {
      throw new Error('Le fichier ZIP est vide');
    }

    try {
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

  const openZipPopup = async (asset) => {
    const token = localStorage.getItem('token');
    if (!token) { 
      alert('Connectez-vous'); 
      return; 
    }

    zip.setLoading(true);

    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/assets/${asset.id}/download`,
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
            `${API_BASE_URL}/assets/${asset.id}/download`,
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
          const files = await extractZipContent(blob);
          if (files && files.length > 0) {
            zip.setZipFiles(files);
            zip.setCurrentAssetId(asset.id);
            zip.setShowZipPopup(true);
          }
          return;
        }
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      const files = await extractZipContent(blob);
      if (files && files.length > 0) {
        zip.setZipFiles(files);
        zip.setCurrentAssetId(asset.id);
        zip.setShowZipPopup(true);
      }
    } catch (err) {
      console.error('Erreur analyse ZIP:', err);
      alert('Erreur lors de l\'analyse du ZIP: ' + err.message);
    } finally {
      zip.setLoading(false);
    }
  };

  // Visualiser un modèle 3D depuis un ZIP (version améliorée avec support FBX)
  const viewZipModel = async (zipFile, asset) => {
    const token = localStorage.getItem('token');
    if (!token) { 
      alert('Connectez-vous pour visualiser ce modèle');
      return; 
    }

    try {
      const ext = zipFile.extension || zipFile.filename.split('.').pop()?.toLowerCase() || '';
      
      const supportedFormats = ['glb', 'gltf', 'obj', 'stl', 'ply', 'babylon', 'fbx'];
      const isFormatSupported = supportedFormats.includes(ext);
      
      if (!isFormatSupported) {
        alert(`Le format ${ext.toUpperCase()} n'est pas supporté.\n\nFormats supportés: GLB, GLTF, OBJ, STL, PLY, FBX`);
        return;
      }

      // Télécharger le ZIP complet
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/assets/${asset.id}/download`,
        {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        },
        60000
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      const zipObj = await JSZip.loadAsync(blob);
      
      let textureFiles = [];
      let fileEntry = zipObj.file(zipFile.path);
      
      if (!fileEntry) {
        const allFiles = Object.keys(zipObj.files);
        const matchedFile = allFiles.find(f => f.includes(zipFile.filename) || f.endsWith(zipFile.filename));
        if (matchedFile) {
          fileEntry = zipObj.file(matchedFile);
          zipFile.path = matchedFile;
        }
      }
      
      if (!fileEntry) {
        alert('Fichier 3D non trouvé dans le ZIP');
        return;
      }

      let fileName = zipFile.filename;
      if (!fileName.toLowerCase().endsWith(`.${ext}`)) {
        fileName = `${fileName}.${ext}`;
      }

      // Pour les fichiers FBX, on utilise ArrayBuffer (comme dans AssetsPanel)
      if (ext === 'fbx') {
        const fileData = await fileEntry.async('arraybuffer');
        
        // Valider le contenu FBX
        const validation = validateFBXContent(fileData);
        
        if (!validation.valid) {
          alert(
            `❌ Le fichier FBX semble être invalide ou corrompu\n\n` +
            `Raison: ${validation.reason}\n\n` +
            `Solutions:\n` +
            `• Assurez-vous que c'est bien un fichier FBX valide\n` +
            `• Convertissez le fichier en GLB/GLTF avec Blender\n` +
            `• Utilisez un outil comme FBX Converter pour réexporter\n` +
            `• Téléchargez le ZIP pour l'ouvrir dans un logiciel 3D`
          );
          return;
        }

        const fileBlob = new Blob([fileData], { type: 'application/octet-stream' });
        const fileUrl = URL.createObjectURL(fileBlob);
        
        // Extraire les textures pour FBX
        const textureExts = ['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp', 'tiff', 'dds', 'exr', 'hdr'];
        const allFiles = Object.keys(zipObj.files);
        const filePath = zipFile.path || zipFile.filename;
        const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
        
        const texturePaths = allFiles.filter(f => {
          const fileExt = f.split('.').pop()?.toLowerCase() || '';
          const isTexture = textureExts.includes(fileExt);
          const isInSameFolder = f.startsWith(fileDir) || fileDir === '';
          const isSystemFile = f.includes('__MACOSX') || f.includes('.DS_Store');
          return isTexture && isInSameFolder && !isSystemFile;
        });
        
        for (const texPath of texturePaths) {
          try {
            const texFile = zipObj.file(texPath);
            if (texFile) {
              const texBlob = await texFile.async('blob');
              const texUrl = URL.createObjectURL(texBlob);
              const texName = texPath.split('/').pop();
              textureFiles.push({
                path: texPath,
                url: texUrl,
                blob: texBlob,
                name: texName
              });
            }
          } catch (e) {
            console.warn('Impossible d\'extraire la texture:', texPath, e);
          }
        }
        
        if (textureFiles.length > 0) {
          console.log(`📦 ${textureFiles.length} texture(s) trouvée(s) pour le modèle FBX`);
        }

        // Créer l'asset virtuel pour le ModelViewer
        const virtualAsset = {
          id: asset.id,
          title: fileName,
          name: fileName,
          ext: ext,
          file_type: '3d_model',
          file_url: fileUrl,
          _blob: fileBlob,
          _arrayBuffer: fileData,  // Important pour FBX
          _zipFile: zipFile,
          _textures: textureFiles,
          _isFBX: true,
          _fbxFormat: validation.format,
          _assetDir: zipFile.path?.substring(0, zipFile.path.lastIndexOf('/')) || ''
        };

        modelViewer.setSelectedModel({ 
          id: asset.id, 
          name: fileName, 
          token, 
          ext: ext, 
          asset: virtualAsset,
          fileUrl: fileUrl,
          arrayBuffer: fileData,  // Passer l'ArrayBuffer
          blob: fileBlob,
          textures: textureFiles,
          selectedZipFile: zipFile,
          fbxFormat: validation.format
        });
        modelViewer.setShowModelViewer(true);
        zip.setShowZipPopup(false);
        
      } else {
        // Pour les autres formats (GLB, OBJ, etc.)
        const fileData = await fileEntry.async('blob');
        const fileUrl = URL.createObjectURL(fileData);

        const virtualAsset = {
          id: asset.id,
          title: fileName,
          name: fileName,
          ext: ext,
          file_type: '3d_model',
          file_url: fileUrl,
          _blob: fileData,
          _zipFile: zipFile,
          _textures: [],
          _isFBX: false,
          _assetDir: zipFile.path?.substring(0, zipFile.path.lastIndexOf('/')) || ''
        };

        modelViewer.setSelectedModel({ 
          id: asset.id, 
          name: fileName, 
          token, 
          ext: ext, 
          asset: virtualAsset,
          fileUrl: fileUrl,
          blob: fileData,
          textures: [],
          selectedZipFile: zipFile
        });
        modelViewer.setShowModelViewer(true);
        zip.setShowZipPopup(false);
      }
      
    } catch (err) {
      console.error('Erreur extraction modèle 3D:', err);
      let errorMessage = '❌ Erreur lors de l\'extraction du modèle 3D\n\n';
      
      if (err.message.includes('FBXLoader') || err.message.includes('version number')) {
        errorMessage += 
          'Le fichier FBX est corrompu ou dans un format non supporté.\n\n' +
          'Solutions:\n' +
          '• Convertissez le fichier en GLB/GLTF avec Blender\n' +
          '• Utilisez un outil comme FBX Converter pour réexporter\n' +
          '• Téléchargez le ZIP pour l\'ouvrir dans un logiciel 3D';
      } else if (err.message.includes('corrompu') || err.message.includes('invalid')) {
        errorMessage += 'Le fichier ZIP est corrompu ou invalide.';
      } else {
        errorMessage += err.message;
      }
      
      alert(errorMessage);
    }
  };

  // ============ FIN FONCTIONS ZIP ============

  // Récupérer les assets de l'utilisateur connecté
  const fetchUserAssets = useCallback(async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const userProfile = await apiRequest('/auth/profile');
      const currentUserId = userProfile.user?.id;
      
      if (!currentUserId) {
        throw new Error('ID utilisateur non trouvé');
      }

      const assetsData = await apiRequest(`/assets?uploaded_by=${currentUserId}&limit=999`);
      const allUserAssets = assetsData.assets || [];
      
      const userAssetsList = allUserAssets.filter(asset => 
        asset.visibility === 'public' || asset.visibility === 'team'
      );
      
      const hiddenCount = allUserAssets.length - userAssetsList.length;
      if (hiddenCount > 0) {
        console.log(`🔒 ${hiddenCount} asset(s) privé(s) masqué(s) du dashboard`);
      }
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyUploadsCount = userAssetsList.filter(asset => 
        new Date(asset.created_at) >= oneWeekAgo
      ).length;
      
      const usedStorageBytes = userAssetsList.reduce((sum, asset) => sum + (asset.file_size || 0), 0);
      const usedStorageGB = usedStorageBytes / (1024 * 1024 * 1024);
      
      setDashboardData({
        userAssets: userAssetsList,
        totalAssets: userAssetsList.length,
        weeklyUploads: weeklyUploadsCount,
        usedStorage: parseFloat(usedStorageGB.toFixed(1)),
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  useEffect(() => {
    fetchUserAssets();
  }, [fetchUserAssets]);

  // Pagination
  const totalPages = Math.ceil(dashboardData.userAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAssets = dashboardData.userAssets.slice(startIndex, startIndex + itemsPerPage);

  // Gestion du changement de page
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Gestion de l'affichage (œil)
  const handleView = (asset) => {
    // ZIP
    if (isZipFile(asset)) {
      openZipPopup(asset);
      return;
    }

    // 3D
    if (is3DModel(asset)) {
      const token = localStorage.getItem('token');
      if (!token) { 
        alert('Connectez-vous pour visualiser ce modèle');
        return; 
      }

      let cleanExt = (asset.ext || asset.file_name?.split('.').pop() || '')
        .replace(/^\./, '')
        .toLowerCase();

      let fileName = asset.title || asset.name || asset.file_name || 'model';
      if (cleanExt && !fileName.toLowerCase().endsWith(`.${cleanExt}`)) {
        fileName = `${fileName}.${cleanExt}`;
      }

      modelViewer.setSelectedModel({ 
        id: asset.id, 
        name: fileName, 
        token, 
        ext: cleanExt, 
        asset 
      });
      modelViewer.setShowModelViewer(true);
      return;
    }

    // Image
    if (isImageFile(asset)) {
      const imageUrl = asset.file_url || asset.capture_url;
      if (imageUrl) {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL.replace('/api', '')}${imageUrl}`;
        mediaViewer.setSelectedMedia({ asset, mediaUrl: fullUrl, mediaType: 'image' });
        mediaViewer.setShowMediaViewer(true);
      }
      return;
    }

    // Vidéo
    if (isVideoFile(asset)) {
      const videoUrl = asset.file_url || asset.video_url || asset.capture_url;
      if (videoUrl) {
        const fullUrl = videoUrl.startsWith('http') ? videoUrl : `${API_BASE_URL.replace('/api', '')}${videoUrl}`;
        mediaViewer.setSelectedMedia({ asset, mediaUrl: fullUrl, mediaType: 'video' });
        mediaViewer.setShowMediaViewer(true);
      }
      return;
    }

    // Autre - aperçu simple
    openPreview(asset.title || asset.file_name);
  };

  // Gestion du téléchargement
  const handleDownload = async (asset) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Connectez-vous pour télécharger');
        return;
      }

      let fileName = asset.title || asset.name || asset.file_name || 'fichier';
      
      const ext = asset.ext || asset.file_name?.split('.').pop() || '';
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
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
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
    }
  };

  // Nettoyage des URLs lors du démontage
  useEffect(() => {
    return () => {
      // Nettoyer les URLs des textures
      if (modelViewer.selectedModel?.textures) {
        modelViewer.selectedModel.textures.forEach(t => {
          if (t.url) URL.revokeObjectURL(t.url);
        });
      }
      if (modelViewer.selectedModel?.fileUrl) {
        URL.revokeObjectURL(modelViewer.selectedModel.fileUrl);
      }
    };
  }, [modelViewer.selectedModel]);

  if (dashboardData.loading && !dashboardData.userAssets.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--text-muted)' }}>Chargement de votre tableau de bord...</div>
      </div>
    );
  }

  return (
    <>
      {/* Media Viewer Popup */}
      {mediaViewer.showMediaViewer && mediaViewer.selectedMedia && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              mediaViewer.closeMediaViewer();
            }
          }}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.6)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{ fontSize: 20 }}>
                  {mediaViewer.selectedMedia.mediaType === 'video' ? '🎬' : '🖼️'}
                </span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mediaViewer.selectedMedia.asset.title || mediaViewer.selectedMedia.asset.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatFileSize(mediaViewer.selectedMedia.asset.file_size)} • {mediaViewer.selectedMedia.mediaType === 'video' ? 'Vidéo' : 'Image'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => mediaViewer.closeMediaViewer()}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              minHeight: 0
            }}>
              {mediaViewer.selectedMedia.mediaType === 'video' ? (
                <video
                  src={mediaViewer.selectedMedia.mediaUrl}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    borderRadius: '8px',
                    background: '#000'
                  }}
                />
              ) : (
                <img
                  src={mediaViewer.selectedMedia.mediaUrl}
                  alt={mediaViewer.selectedMedia.asset.title || mediaViewer.selectedMedia.asset.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    background: '#000'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div style={{
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.6)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0,
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)'
            }}>
              <div>{mediaViewer.selectedMedia.mediaType === 'video' ? '▶️ Lecture en cours' : '👁️ Visualisation'}</div>
              <div>ESC: Fermer</div>
            </div>
          </div>
        </div>
      )}

      {/* ModelViewer 3D - Version avec support FBX */}
      {modelViewer.showModelViewer && modelViewer.selectedModel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: '#0a0f1a'
        }}>
          <ModelViewer
            key={`model-${modelViewer.selectedModel.id}-${Date.now()}`}
            assetId={modelViewer.selectedModel.id}
            assetName={modelViewer.selectedModel.name}
            token={localStorage.getItem('token')}
            assetExt={modelViewer.selectedModel.ext}
            assetData={modelViewer.selectedModel.asset}
            selectedZipFile={modelViewer.selectedModel.selectedZipFile}
            modelData={{
              arrayBuffer: modelViewer.selectedModel.arrayBuffer,
              blob: modelViewer.selectedModel.blob,
              textures: modelViewer.selectedModel.textures,
              fbxFormat: modelViewer.selectedModel.fbxFormat
            }}
            onClose={() => {
              modelViewer.closeModelViewer();
            }}
          />
        </div>
      )}

      {/* ZIP Popup */}
      {zip.showZipPopup && (
        <div
          style={{
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
          }}
          onClick={() => zip.setShowZipPopup(false)}
        >
          <div
            style={{
              background: '#0a0f1a',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              width: '90%',
              maxWidth: 800,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                  {zip.zipFiles.length} fichier(s) trouvé(s)
                </p>
              </div>
              <button
                onClick={() => zip.setShowZipPopup(false)}
                style={{
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
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '16px 20px',
              overflowY: 'auto',
              flex: 1
            }}>
              {(() => {
                const groupedFiles = {};
                zip.zipFiles.forEach(file => {
                  const folder = file.folder || 'Racine';
                  if (!groupedFiles[folder]) groupedFiles[folder] = [];
                  groupedFiles[folder].push(file);
                });

                const sortedFolders = Object.keys(groupedFiles).sort();

                return sortedFolders.map((folder) => (
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
                      {groupedFiles[folder].map((file, index) => {
                        const ext = file.filename.split('.').pop()?.toLowerCase() || '';
                        const is3DFile = SUPPORTED_3D_FORMATS.includes(ext);
                        const supportedFormats = ['glb', 'gltf', 'obj', 'stl', 'ply', 'babylon', 'fbx'];
                        const isSupportedFormat = supportedFormats.includes(ext);
                        const canView = is3DFile && isSupportedFormat;

                        return (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: 6,
                              cursor: canView ? 'pointer' : 'default',
                              transition: 'all 0.2s',
                              border: '1px solid transparent',
                              opacity: is3DFile && !isSupportedFormat ? 0.6 : 1
                            }}
                            onClick={() => {
                              if (canView) {
                                const asset = dashboardData.userAssets.find(a => a.id === zip.currentAssetId);
                                if (asset) {
                                  viewZipModel(file, asset);
                                }
                              } else if (is3DFile && !isSupportedFormat) {
                                alert(`Le format ${ext.toUpperCase()} n'est pas supporté.\n\nFormats supportés: GLB, GLTF, OBJ, STL, PLY, FBX`);
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (canView) {
                                e.currentTarget.style.background = 'rgba(16,185,129,0.15)';
                                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                              e.currentTarget.style.borderColor = 'transparent';
                            }}
                          >
                            <span style={{ fontSize: 20 }}>
                              {is3DFile ? (ext === 'fbx' ? '📦' : '🎮') : '📄'}
                            </span>
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
                                gap: 8,
                                flexWrap: 'wrap'
                              }}>
                                <span style={{ 
                                  color: canView ? '#10b981' : (is3DFile ? '#f59e0b' : '#666')
                                }}>
                                  {file.extension.toUpperCase()}
                                </span>
                                <span>•</span>
                                <span>{(file.size / 1024).toFixed(1)} KB</span>
                                {canView && (
                                  <span style={{ color: '#10b981', fontSize: 9 }}>
                                    🎯 Visualiser
                                  </span>
                                )}
                                {is3DFile && !isSupportedFormat && (
                                  <span style={{ color: '#f59e0b', fontSize: 9 }}>
                                    ⚠️ Format non supporté
                                  </span>
                                )}
                                {ext === 'fbx' && (
                                  <span style={{ color: '#8B5CF6', fontSize: 9 }}>
                                    📦 FBX
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                💡 Formats supportés: GLB, GLTF, OBJ, STL, PLY, FBX
              </span>
              <button
                onClick={() => zip.setShowZipPopup(false)}
                style={{
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
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi-card" style={{ '--kglow': `${config.accent}22` }}>
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: `${config.accent}22`, color: config.accent }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
            <span className="kpi-tag up">+{dashboardData.totalAssets > 0 ? Math.min(15, dashboardData.weeklyUploads * 2) : 0}%</span>
          </div>
          <div className="kpi-value">{dashboardData.totalAssets.toLocaleString()}</div>
          <div className="kpi-label">Assets publics</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'rgba(245,158,11,.15)', color: '#F59E0B' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className="kpi-tag up">+{dashboardData.weeklyUploads > 0 ? Math.min(15, dashboardData.weeklyUploads * 2) : 0}%</span>
          </div>
          <div className="kpi-value">{dashboardData.weeklyUploads}</div>
          <div className="kpi-label">Uploads / semaine</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'rgba(139,92,246,.15)', color: '#8B5CF6' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 2,7 12,12 22,7" />
                <polyline points="2,17 12,22 22,17" />
                <polyline points="2,12 12,17 22,12" />
              </svg>
            </div>
            <span className="kpi-tag up">+3</span>
          </div>
          <div className="kpi-value">{isGfx ? Math.min(20, Math.floor(dashboardData.totalAssets / 10)) : Math.min(15, Math.floor(dashboardData.totalAssets / 8))}</div>
          <div className="kpi-label">{isGfx ? 'Collections' : 'Projets actifs'}</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'rgba(239,68,68,.12)', color: '#EF4444' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <span className={`kpi-tag ${storagePercent > 50 ? 'dn' : 'up'}`}>{storagePercent}%</span>
          </div>
          <div className="kpi-value">{dashboardData.usedStorage.toFixed(1)}</div>
          <div className="kpi-label">GB utilisés</div>
        </div>
      </div>

      {/* Tableau des assets avec pagination - SECTION ACTIONS SUPPRIMÉE */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <span className="card-title">Mes assets uploads ({dashboardData.totalAssets})</span>
          <button className="btn btn-sm" onClick={fetchUserAssets}>
            🔄 Rafraîchir
          </button>
        </div>

        {dashboardData.error && (
          <div style={{ padding: '12px', fontSize: '12px', color: '#F87171', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', margin: '12px' }}>
            {dashboardData.error}
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Fichier</th>
              <th>Taille</th>
              <th>Date</th>
              <th>Visibilité</th>
            </tr>
          </thead>
          <tbody>
            {currentAssets.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Vous n'avez pas encore uploadé d'assets publics.
                  <button 
                    onClick={() => window.location.href = '/user/assets/upload'}
                    style={{ display: 'block', margin: '16px auto 0', padding: '8px 16px', background: config.accent, border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                  >
                    Uploader un asset
                  </button>
                </td>
              </tr>
            ) : (
              currentAssets.map((asset) => {
                const is3D = is3DModel(asset);
                const isVideo = isVideoFile(asset);
                const isImage = isImageFile(asset);
                const isZIP = isZipFile(asset);
                const ext = getFileExt(asset.file_name || asset.title);
                const icon = getFileIcon(asset.file_type, asset.file_name || asset.title);

                return (
                  <tr key={asset.id}>
                    <td>
                      <div className="file-cell">
                        <div className={`file-icon ${icon}`}>{ext}</div>
                        <div>
                          <div className="fn" style={{ fontWeight: 500 }}>{asset.title || asset.name || asset.file_name}</div>
                          <div className="fm" style={{ fontSize: 10, color: 'var(--muted)' }}>
                            {isZIP ? '📦 Archive ZIP' : (asset.file_type || 'Fichier')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
                      {formatFileSize(asset.file_size)}
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--dim)' }}>
                      {formatDate(asset.created_at)}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: asset.visibility === 'public' ? 'rgba(16,185,129,.15)' : 'rgba(59,130,246,.15)',
                        color: asset.visibility === 'public' ? '#10B981' : '#3B82F6'
                      }}>
                        {asset.visibility === 'public' ? '🌍 Public' : '👥 Team'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination - visible quand plus de 10 lignes */}
        {dashboardData.userAssets.length > itemsPerPage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap',
            gap: 12,
            background: 'rgba(0,0,0,0.15)',
            borderRadius: '0 0 12px 12px'
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 11
              }}>
                {dashboardData.userAssets.length > 0 ? 
                  `${startIndex + 1}–${Math.min(startIndex + itemsPerPage, dashboardData.userAssets.length)}` : 
                  '0'}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                sur {dashboardData.userAssets.length}
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: 6, 
              alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              padding: '4px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  border: 'none',
                  background: currentPage === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                  color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace"
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }
                }}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isNearCurrent = Math.abs(page - currentPage) <= 2;
                const isFirstOrLast = page === 1 || page === totalPages;
                const showPage = isNearCurrent || isFirstOrLast;

                if (!showPage) {
                  if (page === currentPage - 3 || page === currentPage + 3) {
                    return (
                      <span
                        key={`dots-${page}`}
                        style={{
                          width: 34,
                          height: 34,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(255,255,255,0.2)',
                          fontSize: 12,
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                      >
                        …
                      </span>
                    );
                  }
                  return null;
                }

                const isActive = page === currentPage;

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 6,
                      border: 'none',
                      background: isActive ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)',
                      color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: "'JetBrains Mono', monospace",
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 0 20px rgba(59,130,246,0.15)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                      }
                    }}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  border: 'none',
                  background: currentPage === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                  color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace"
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }
                }}
              >
                ›
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                Aller à
              </span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) {
                    handlePageChange(val);
                  }
                }}
                style={{
                  width: 44,
                  padding: '4px 6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4,
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59,130,246,0.4)';
                  e.target.style.background = 'rgba(59,130,246,0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
              />
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                / {totalPages}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}