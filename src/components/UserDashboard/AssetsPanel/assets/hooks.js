// src/components/UserDashboard/assets/hooks.js

import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './constants';
import { getUserData, getUserIdFromToken, canViewAsset } from './utils';

// Hook pour récupérer les assets
export const useAssets = (filters) => {
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userData = getUserData();
  const isAdmin = userData?.role === 'admin' || userData?.is_admin === true;
  const currentUserId = userData?.id || userData?.user_id || getUserIdFromToken();

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
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
      
      const assetsData = rawAssetsData.filter(asset => canViewAsset(asset, isAdmin, currentUserId));
      const hiddenCount = rawAssetsData.length - assetsData.length;
      if (hiddenCount > 0) {
        console.warn(`${hiddenCount} asset(s) masqué(s) côté client.`);
      }

      setAllAssets(assetsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin, currentUserId]);

  return { allAssets, setAllAssets, loading, error, fetchAssets };
};

// Hook pour récupérer les projets
export const useProjects = () => {
  const [projects, setProjects] = useState([]);

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

  return { projects, fetchProjects };
};

// Hook pour récupérer les catégories
export const useCategories = () => {
  const [categories, setCategories] = useState([]);

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

  return { categories, fetchCategories };
};

// Hook pour gérer les filtres
export const useFilters = () => {
  const [filters, setFilters] = useState({
    search: '',
    visibility: '',
    file_type: '',
    category: '',
    project: '',
    created_by: '',
    date_from: '',
    date_to: ''
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length;

  return { filters, setFilters, handleFilterChange, resetFilters, activeFiltersCount };
};

// Hook pour la pagination
export const usePagination = (totalItems, itemsPerPage) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (currentPage < 1 && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return { currentPage, setCurrentPage, totalPages, startIndex, endIndex };
};

// Hook pour l'upload
export const useUpload = () => {
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCaptureSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadCapture(file);
      const previewUrl = URL.createObjectURL(file);
      setUploadCapturePreview(previewUrl);
    }
  };

  return {
    showUploadModal,
    setShowUploadModal,
    uploading,
    setUploading,
    selectedFiles,
    setSelectedFiles,
    uploadTitle,
    setUploadTitle,
    uploadDescription,
    setUploadDescription,
    uploadVisibility,
    setUploadVisibility,
    uploadCategories,
    setUploadCategories,
    uploadTags,
    setUploadTags,
    uploadCapture,
    setUploadCapture,
    uploadCapturePreview,
    setUploadCapturePreview,
    uploadTriangleCount,
    setUploadTriangleCount,
    selectedProject,
    setSelectedProject,
    selectedCategory,
    setSelectedCategory,
    resetUploadForm,
    handleFileSelect,
    removeFile,
    handleCaptureSelect
  };
};

// Hook pour l'édition
export const useEdit = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState('private');
  const [editCategory, setEditCategory] = useState('');
  const [editProject, setEditProject] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editing, setEditing] = useState(false);

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

  return {
    showEditModal,
    setShowEditModal,
    assetToEdit,
    setAssetToEdit,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editVisibility,
    setEditVisibility,
    editCategory,
    setEditCategory,
    editProject,
    setEditProject,
    editTags,
    setEditTags,
    editing,
    setEditing,
    openEditModal,
    closeEditModal
  };
};

// Hook pour les notifications
export const useNotification = () => {
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    title: '',
    message: '',
    duration: 4000
  });

  const showNotification = (type, title, message, duration = 4000) => {
    setNotification({
      show: true,
      type,
      title,
      message,
      duration
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Auto-fermeture
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        closeNotification();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.show, notification.duration]);

  return { notification, showNotification, closeNotification };
};

// Hook pour la suppression
export const useDelete = () => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

  return { showConfirmModal, setShowConfirmModal, assetToDelete, setAssetToDelete };
};

// Hook pour le ZIP
export const useZip = () => {
  const [showZipPopup, setShowZipPopup] = useState(false);
  const [zipFiles, setZipFiles] = useState([]);
  const [currentAssetId, setCurrentAssetId] = useState(null);

  return { showZipPopup, setShowZipPopup, zipFiles, setZipFiles, currentAssetId, setCurrentAssetId };
};

// Hook pour le Media Viewer
export const useMediaViewer = () => {
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  return { showMediaViewer, setShowMediaViewer, selectedMedia, setSelectedMedia };
};

// Hook pour le Model Viewer
export const useModelViewer = () => {
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  return { showModelViewer, setShowModelViewer, selectedModel, setSelectedModel };
};