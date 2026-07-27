// src/components/UserDashboard/CategoryAssetsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { MdArrowBack, MdAdd, MdSearch, MdClose } from "react-icons/md";
import { LiaEyeSolid, LiaDownloadSolid, LiaTrashAltSolid } from 'react-icons/lia';
import { PiCubeLight } from "react-icons/pi";
import { FaRegFile } from "react-icons/fa6";
import { RiDossierFill } from "react-icons/ri";
import { MdWeb, MdPalette, MdPhoneAndroid, MdBuild, MdBarChart, MdSecurity, MdTrendingUp, MdMenuBook, MdSportsEsports, MdSmartToy, MdCloud, MdInventory, MdFolder } from 'react-icons/md';
import ModelViewer from '../../UserDashboard/ModelViewer';
import { MdImage, MdVideoLibrary } from 'react-icons/md';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Active les logs de debug uniquement en développement.
// Mettre DEBUG_CATEGORY_ASSETS = true en local si besoin d'investiguer.
const DEBUG_CATEGORY_ASSETS = process.env.NODE_ENV === 'development';

const debugLog = (...args) => {
  if (DEBUG_CATEGORY_ASSETS) {
  }
};

const debugError = (...args) => {
  if (DEBUG_CATEGORY_ASSETS) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
};

// Liste des icônes disponibles
const iconsList = [
  { icon: <MdWeb size={24} />, name: 'Web', value: 'web' },
  { icon: <MdPalette size={24} />, name: 'Design', value: 'design' },
  { icon: <MdPhoneAndroid size={24} />, name: 'Mobile', value: 'mobile' },
  { icon: <MdBuild size={24} />, name: 'DevOps', value: 'devops' },
  { icon: <MdBarChart size={24} />, name: 'Data', value: 'data' },
  { icon: <MdSecurity size={24} />, name: 'Sécurité', value: 'security' },
  { icon: <MdTrendingUp size={24} />, name: 'Marketing', value: 'marketing' },
  { icon: <MdMenuBook size={24} />, name: 'Docs', value: 'docs' },
  { icon: <MdSportsEsports size={24} />, name: 'Gaming', value: 'gaming' },
  { icon: <MdSmartToy size={24} />, name: 'AI', value: 'ai' },
  { icon: <MdCloud size={24} />, name: 'Cloud', value: 'cloud' },
  { icon: <MdInventory size={24} />, name: 'Package', value: 'package' }
];

// Fonction pour récupérer le composant d'icône à partir de la valeur
const getIconComponent = (iconValue, size = 24) => {
  if (!iconValue) return <MdFolder size={size} />;

  const icon = iconsList.find(i => i.value === iconValue);
  if (icon) {
    return React.cloneElement(icon.icon, { size });
  }

  return <MdFolder size={size} />;
};

// Fonction helper pour les requêtes API
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
    throw new Error(data.error || data.message || 'Une erreur est survenue');
  }

  return data;
};

const is3DModel = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  const supported3DFormats = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds'];

  return supported3DFormats.includes(ext) || fileType === '3d_model' ||
    supported3DFormats.some(format => name?.endsWith(`.${format}`));
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

// Fonction pour récupérer les données utilisateur depuis localStorage
const getUserData = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (e) {
    debugError('Erreur lors du parsing user:', e);
  }
  return {};
};

// ============ DÉTECTER SI UN ASSET A UNE CATÉGORIE ============
const assetHasAnyCategory = (asset) => {
  if (!asset) return false;

  debugLog('🔍 Vérification de l\'asset:', asset.title || asset.name);

  // 1. Relation asset_categories (table de liaison) — c'est le plus fiable
  // car c'est la forme retournée par l'API.
  if (asset.asset_categories && Array.isArray(asset.asset_categories) && asset.asset_categories.length > 0) {
    const hasCategory = asset.asset_categories.some(ac => ac.category_id);
    if (hasCategory) {
      debugLog('✅ Asset a des asset_categories:', asset.asset_categories);
      return true;
    }
  }

  // 2. Relation categories (tableau d'objets)
  if (asset.categories && Array.isArray(asset.categories) && asset.categories.length > 0) {
    debugLog('✅ Asset a des categories:', asset.categories);
    return true;
  }

  // 3. Champ category_id (direct)
  if (asset.category_id) {
    debugLog(`✅ Asset a category_id: ${asset.category_id}`);
    return true;
  }

  // 4. Champ categoryId
  if (asset.categoryId) {
    debugLog(`✅ Asset a categoryId: ${asset.categoryId}`);
    return true;
  }

  // 5. Champ category (objet)
  if (asset.category && typeof asset.category === 'object') {
    if (asset.category.id || asset.category.name) {
      debugLog('✅ Asset a category:', asset.category);
      return true;
    }
  }

  // 6. Champ category (string)
  if (asset.category && typeof asset.category === 'string' && asset.category.trim() !== '') {
    debugLog(`✅ Asset a category (string): ${asset.category}`);
    return true;
  }

  // 7. Champ category_ids (tableau)
  if (asset.category_ids && Array.isArray(asset.category_ids) && asset.category_ids.length > 0) {
    debugLog('✅ Asset a category_ids:', asset.category_ids);
    return true;
  }

  // 8. Champs de nom de catégorie
  if (asset.category_name && typeof asset.category_name === 'string' && asset.category_name.trim() !== '') {
    debugLog(`✅ Asset a category_name: ${asset.category_name}`);
    return true;
  }

  if (asset.category_display_name && typeof asset.category_display_name === 'string' && asset.category_display_name.trim() !== '') {
    debugLog(`✅ Asset a category_display_name: ${asset.category_display_name}`);
    return true;
  }

  // 9. Métadonnées
  if (asset.metadata && typeof asset.metadata === 'object') {
    if (asset.metadata.category_id || asset.metadata.categoryId || asset.metadata.category) {
      debugLog('✅ Asset a category dans metadata:', asset.metadata);
      return true;
    }
  }

  // 10. Tout champ dont le nom contient 'category'
  const categoryFields = Object.keys(asset).filter(key =>
    key.toLowerCase().includes('category') &&
    asset[key] !== null &&
    asset[key] !== undefined &&
    asset[key] !== ''
  );

  for (const field of categoryFields) {
    const value = asset[field];
    if (Array.isArray(value) && value.length > 0) {
      debugLog(`✅ Champ ${field} est un tableau non vide:`, value);
      return true;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      debugLog(`✅ Champ ${field} est une chaîne non vide: ${value}`);
      return true;
    }
    if (typeof value === 'object' && value !== null) {
      if (value.id || value.name || value.display_name) {
        debugLog(`✅ Champ ${field} est un objet avec id/name:`, value);
        return true;
      }
    }
  }

  debugLog(`❌ Aucune catégorie trouvée pour l'asset "${asset.title || asset.name}"`);
  return false;
};

// ============ FONCTION DE DEBUG POUR AFFICHER LA STRUCTURE D'UN ASSET ============
const debugAssetStructure = (asset) => {
  if (!DEBUG_CATEGORY_ASSETS) return;

  debugLog('========== DEBUG ASSET STRUCTURE ==========');
  debugLog('ID:', asset.id);
  debugLog('Nom:', asset.title || asset.name);
  debugLog('Type:', asset.file_type);
  debugLog('Extension:', asset.ext);
  debugLog('-------------------------------------------');

  const categoryFields = Object.keys(asset).filter(key =>
    key.toLowerCase().includes('category')
  );

  if (categoryFields.length === 0) {
    debugLog('❌ Aucun champ de catégorie trouvé');
  } else {
    debugLog('📋 Champs de catégorie trouvés:');
    categoryFields.forEach(field => {
      debugLog(`  ${field}:`, JSON.stringify(asset[field], null, 2));
    });
  }

  if (asset.asset_categories) {
    debugLog('📋 asset_categories:', JSON.stringify(asset.asset_categories, null, 2));
  }
  if (asset.categories) {
    debugLog('📋 categories:', JSON.stringify(asset.categories, null, 2));
  }

  debugLog('===========================================');
};

export default function CategoryAssetsPage({ categoryId, categoryData, onBack }) {
  const [category, setCategory] = useState(categoryData || null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [error, setError] = useState(null);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [hoveredAssetId, setHoveredAssetId] = useState(null);

  // États pour le ModelViewer 3D
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Récupérer les données utilisateur
  const userData = getUserData();
  const isAdmin = userData?.role === 'admin' || userData?.is_admin === true;
  const currentUserId = userData?.id || userData?.user_id;

  // Vérifier si l'utilisateur peut supprimer l'asset (admin ou propriétaire)
  const canDeleteAsset = (asset) => {
    if (isAdmin) return true;
    if (asset.created_by === currentUserId) return true;
    if (asset.uploaded_by === currentUserId) return true;
    if (asset.user_id === currentUserId) return true;
    return false;
  };

  // ============ CHARGER LES UTILISATEURS ============
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      let userList = [];

      try {
        debugLog('📡 Récupération des utilisateurs depuis /users/admin/users');
        const data = await apiRequest('/users/admin/users');

        if (Array.isArray(data)) {
          userList = data;
        } else if (data.users && Array.isArray(data.users)) {
          userList = data.users;
        } else if (data.data && Array.isArray(data.data)) {
          userList = data.data;
        }

        debugLog(`✅ ${userList.length} utilisateurs récupérés depuis /users/admin/users`);
      } catch (err) {
        debugError('❌ Erreur lors de la récupération des utilisateurs:', err);
        // Tentative avec un autre endpoint
        try {
          debugLog('📡 Tentative avec /admin/users');
          const data = await apiRequest('/admin/users');
          if (Array.isArray(data)) {
            userList = data;
          } else if (data.users && Array.isArray(data.users)) {
            userList = data.users;
          } else if (data.data && Array.isArray(data.data)) {
            userList = data.data;
          }
          debugLog(`✅ ${userList.length} utilisateurs récupérés depuis /admin/users`);
        } catch (err2) {
          debugError('❌ Erreur avec /admin/users:', err2);
        }
      }

      // Si aucun utilisateur n'a été trouvé, utiliser les données des assets
      if (userList.length === 0) {
        debugLog('⚠️ Aucun utilisateur trouvé, utilisation des données des assets');
        try {
          const data = await apiRequest('/assets?limit=1000');
          let allAssets = [];
          if (Array.isArray(data)) allAssets = data;
          else if (data.assets && Array.isArray(data.assets)) allAssets = data.assets;
          else if (data.data && Array.isArray(data.data)) allAssets = data.data;

          const userMap = new Map();
          allAssets.forEach(asset => {
            const userId = asset.created_by || asset.uploaded_by || asset.user_id;
            if (userId && !userMap.has(userId)) {
              const userName = asset.created_by_name || asset.uploaded_by_name || `Utilisateur ${userId}`;
              userMap.set(userId, {
                id: userId,
                name: userName,
                email: asset.created_by_email || asset.uploaded_by_email
              });
            }
          });
          userList = Array.from(userMap.values());
          debugLog(`👥 ${userList.length} utilisateurs extraits des assets`);
        } catch (err3) {
          debugError('❌ Erreur lors de l\'extraction des utilisateurs:', err3);
        }
      }

      const formattedUsers = userList.map(user => ({
        id: user.id || user.user_id,
        name: user.name || user.full_name || user.first_name || user.username || user.email || `Utilisateur ${user.id || user.user_id}`,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }));

      setUsers(formattedUsers);
      debugLog(`👥 ${formattedUsers.length} utilisateurs chargés au total`);
    } catch (err) {
      debugError('❌ Erreur lors du chargement des utilisateurs:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Charger les informations de la catégorie
  const fetchCategory = async () => {
    if (categoryData) return;

    try {
      const data = await apiRequest(`/categories/${categoryId}`);
      const fetchedCategory = data.category || data.data || data;
      setCategory(fetchedCategory);
    } catch (err) {
      debugError('Erreur lors du chargement de la catégorie:', err);
      setError(err.message || 'Impossible de charger la catégorie');
    }
  };

  // ============ CHARGER LES ASSETS DE LA CATÉGORIE ============
  const fetchCategoryAssets = async () => {
    try {
      setLoadingAssets(true);
      debugLog('📡 Récupération des assets de la catégorie:', categoryId);
      const data = await apiRequest(`/categories/${categoryId}/assets`);

      let assetsList = [];
      if (Array.isArray(data)) {
        assetsList = data;
      } else if (data.assets && Array.isArray(data.assets)) {
        assetsList = data.assets;
      } else if (data.data && Array.isArray(data.data)) {
        assetsList = data.data;
      }

      if (assetsList.length > 0) {
        debugLog('📋 Structure du premier asset:', assetsList[0]);
        debugAssetStructure(assetsList[0]);
      }

      debugLog(`📁 ${assetsList.length} assets chargés pour la catégorie ${categoryId}`);
      setAssets(assetsList);
    } catch (err) {
      debugError('Erreur lors du chargement des assets de la catégorie:', err);
      setError(err.message || 'Impossible de charger les assets de la catégorie');
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  // ============ CONSTRUIRE LA LISTE FIABLE DES IDS DÉJÀ CATÉGORISÉS ============
  // On ne peut pas se fier uniquement aux champs retournés par GET /assets
  // (asset_categories / category_id, etc.) car selon l'implémentation backend
  // cet endpoint peut ne pas inclure cette relation pour chaque asset.
  // La source de vérité, c'est GET /categories/:id/assets pour CHAQUE
  // catégorie existante : un asset déjà rattaché à n'importe quelle
  // catégorie ne doit jamais apparaître comme "disponible".
  const fetchAllCategorizedAssetIds = async () => {
    const categorizedIds = new Set();

    try {
      const data = await apiRequest('/categories');
      let allCategories = [];
      if (Array.isArray(data)) {
        allCategories = data;
      } else if (data.categories && Array.isArray(data.categories)) {
        allCategories = data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        allCategories = data.data;
      }

      debugLog(`📂 ${allCategories.length} catégories trouvées, vérification des assets de chacune`);

      // Toujours inclure les assets déjà connus de la catégorie courante,
      // même si la liste /categories échoue ou est vide.
      assets.forEach(a => categorizedIds.add(a.id));

      const results = await Promise.allSettled(
        allCategories.map(cat => apiRequest(`/categories/${cat.id}/assets`))
      );

      results.forEach((result, idx) => {
        if (result.status !== 'fulfilled') {
          debugError(`Erreur lors de la récupération des assets de la catégorie ${allCategories[idx]?.id}:`, result.reason);
          return;
        }
        const data = result.value;
        let categoryAssets = [];
        if (Array.isArray(data)) {
          categoryAssets = data;
        } else if (data.assets && Array.isArray(data.assets)) {
          categoryAssets = data.assets;
        } else if (data.data && Array.isArray(data.data)) {
          categoryAssets = data.data;
        }
        categoryAssets.forEach(a => categorizedIds.add(a.id));
      });
    } catch (err) {
      debugError('Erreur lors de la récupération de la liste des catégories:', err);
      // En cas d'échec, on retombe au minimum sur les assets de la catégorie courante.
      assets.forEach(a => categorizedIds.add(a.id));
    }

    debugLog(`🔒 ${categorizedIds.size} assets déjà catégorisés (toutes catégories confondues)`);
    return categorizedIds;
  };

  // ============ CHARGER UNIQUEMENT LES ASSETS SANS AUCUNE CATÉGORIE ============
  const fetchAvailableAssets = async () => {
    try {
      setLoadingAvailable(true);
      debugLog('📡 Récupération de tous les assets');
      const data = await apiRequest('/assets?limit=1000');

      let allAssets = [];
      if (Array.isArray(data)) {
        allAssets = data;
      } else if (data.assets && Array.isArray(data.assets)) {
        allAssets = data.assets;
      } else if (data.data && Array.isArray(data.data)) {
        allAssets = data.data;
      }

      debugLog(`📊 ${allAssets.length} assets récupérés au total`);

      // Source de vérité robuste : IDs déjà catégorisés, croisés sur
      // toutes les catégories, pas seulement déduits des champs de l'asset.
      const categorizedIds = await fetchAllCategorizedAssetIds();

      // Filtrer les assets sans catégorie. On garde aussi le check
      // assetHasAnyCategory en filet de sécurité, au cas où l'asset
      // porte l'info de catégorie mais que /categories/:id/assets serait
      // incomplet pour une raison quelconque (ex: catégorie supprimée).
      const available = allAssets.filter(asset => {
        const isInCategory = categorizedIds.has(asset.id);
        const hasAnyCategory = assetHasAnyCategory(asset);

        if (isInCategory || hasAnyCategory) {
          debugLog(`🔍 Asset "${asset.title || asset.name}" exclu (déjà catégorisé)`);
        }

        return !isInCategory && !hasAnyCategory;
      });

      debugLog(`📊 ${available.length} assets sans catégorie sur ${allAssets.length} au total`);
      debugLog('🔍 Assets disponibles:', available.map(a => a.title || a.name));
      setAvailableAssets(available);
    } catch (err) {
      debugError('Erreur lors du chargement des assets disponibles:', err);
      setError(err.message || 'Impossible de charger les assets disponibles');
    } finally {
      setLoadingAvailable(false);
    }
  };

  // ============ OUVRIR LE MODEL VIEWER 3D ============
  const openModelViewer = (asset) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Connectez-vous pour visualiser ce modèle');
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCategory();
      await fetchCategoryAssets();
      await fetchUsers();
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // Filtrer les assets disponibles
  const filteredAvailableAssets = useMemo(() => {
    return availableAssets.filter(asset => {
      const searchMatch = searchTerm === '' ||
        (asset.title || asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const typeMatch = filterType === 'all' || asset.file_type === filterType;

      const visibilityMatch = filterVisibility === 'all' || asset.visibility === filterVisibility;

      const userId = asset.created_by || asset.uploaded_by || asset.user_id;
      const userMatch = filterUser === 'all' || String(userId) === String(filterUser);

      return searchMatch && typeMatch && visibilityMatch && userMatch;
    });
  }, [availableAssets, searchTerm, filterType, filterVisibility, filterUser]);

  // Ajouter un asset à la catégorie
  const handleAddAsset = async (assetId) => {
    try {
      await apiRequest(`/categories/${categoryId}/assets/${assetId}`, {
        method: 'POST'
      });

      // Retrait optimiste immédiat de la liste des assets disponibles,
      // pour qu'il ne soit jamais réaffichable comme ajoutable avant
      // même que les refetch réseau ci-dessous ne soient résolus.
      setAvailableAssets(prev => prev.filter(a => a.id !== assetId));

      await fetchCategoryAssets();
      await fetchAvailableAssets();
      setShowAddAssetModal(false);
    } catch (err) {
      debugError('Erreur lors de l\'ajout de l\'asset:', err);
      setError(err.message || 'Erreur lors de l\'ajout de l\'asset');
    }
  };

  // Retirer un asset de la catégorie
  const handleRemoveAsset = async () => {
    if (!assetToDelete) return;

    try {
      await apiRequest(`/categories/${categoryId}/assets/${assetToDelete.id}`, {
        method: 'DELETE'
      });

      await fetchCategoryAssets();
      setShowConfirmModal(false);
      setAssetToDelete(null);
    } catch (err) {
      debugError('Erreur lors du retrait de l\'asset:', err);
      setError(err.message || 'Erreur lors du retrait de l\'asset');
    }
  };

  // Télécharger un asset
  const handleDownload = async (assetId, assetName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Erreur: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = assetName || 'fichier';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Téléchargement échoué: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
        <div style={{ color: 'var(--dim)' }}>Chargement...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ fontSize: 16, color: 'var(--dim)', marginBottom: 8 }}>Catégorie non trouvée</div>
        <button onClick={onBack} className="btn btn-primary">
          Retour aux catégories
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,.05)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20
          }}
        >
          <MdArrowBack size={18} />
          Retour aux catégories
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: category.bg || 'rgba(59,130,246,.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32
            }}>
              {getIconComponent(category.icon, 32)}
            </div>
            <div>
              <h1 style={{ fontSize: 24, marginBottom: 8, color: category.color || '#3B82F6' }}>{category.display_name || category.name}</h1>
              {category.description && (
                <p style={{ fontSize: 13, color: 'var(--dim)' }}>{category.description}</p>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              fetchAvailableAssets();
              setShowAddAssetModal(true);
            }}
            style={{ background: '#3B82F6', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <MdAdd size={16} />
            Ajouter un asset
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 18px', background: 'rgba(220,38,38,.15)', color: '#ef4444', fontSize: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Grille des assets de la catégorie */}
      <div className="tbl-wrap" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div className="tbl-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="card-title">Assets de la catégorie</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>{assets.length} fichiers</span>
          </div>
        </div>

        {loadingAssets ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dim)' }}>Chargement des assets...</div>
        ) : assets.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}><RiDossierFill /></div>
            <div>Aucun asset dans cette catégorie</div>
            <button
              onClick={() => {
                fetchAvailableAssets();
                setShowAddAssetModal(true);
              }}
              style={{ marginTop: 16, background: '#3B82F6', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', color: 'white' }}
            >
              + Ajouter un asset
            </button>
          </div>
        ) : (
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
              const assetDisplayName = asset.title || asset.name;

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
                    onClick={() => is3D ? openModelViewer(asset) : null}
                    style={{
                      height: 200,
                      background: 'rgba(0,0,0,.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: is3D ? 'pointer' : 'default',
                      overflow: 'hidden'
                    }}
                  >
                    {is3D ? (
                      asset.capture_url ? (
                        <>
                          <img
                            src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
                            alt={`Aperçu de ${assetDisplayName}`}
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
                        <div style={{ textAlign: 'center', position: 'relative' }}>
                          <div style={{ fontSize: 64, marginBottom: 8 }}><PiCubeLight /></div>
                          <div style={{ fontSize: 12, color: '#3b82f6' }}>Modèle 3D</div>
                          {isHovered && (
                            <div style={{
                              position: 'absolute',
                              bottom: -28,
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
                          alt={`Aperçu de ${assetDisplayName}`}
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
                      {assetDisplayName}
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

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      borderTop: '1px solid rgba(255,255,255,.06)',
                      paddingTop: 12,
                      marginTop: 4
                    }}>
                      <button
                        onClick={() => is3D ? openModelViewer(asset) : null}
                        style={{
                          flex: 1,
                          background: is3D ? 'rgba(16,185,129,.15)' : 'rgba(59,130,246,.15)',
                          border: 'none',
                          padding: '7px',
                          borderRadius: 6,
                          color: is3D ? '#10b981' : '#3B82F6',
                          cursor: is3D ? 'pointer' : 'default',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'background 0.2s',
                          opacity: is3D ? 1 : 0.5
                        }}
                        onMouseEnter={(e) => {
                          if (is3D) e.currentTarget.style.background = 'rgba(16,185,129,.25)';
                        }}
                        onMouseLeave={(e) => {
                          if (is3D) e.currentTarget.style.background = 'rgba(16,185,129,.15)';
                        }}
                      >
                        <LiaEyeSolid size={14} />
                        {is3D ? '3D Viewer' : 'Preview'}
                      </button>
                      <button
                        onClick={() => handleDownload(asset.id, assetDisplayName)}
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

                      {/* Bouton Retirer */}
                      {canDelete && (
                        <button
                          onClick={() => {
                            setAssetToDelete({ id: asset.id, name: assetDisplayName });
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
                          title="Retirer de la catégorie"
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
        )}
      </div>

{/* Modal d'ajout d'asset */}
{showAddAssetModal && (
  <div className="modal-overlay" onClick={() => setShowAddAssetModal(false)}>
    <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900, maxHeight: '85vh', overflow: 'auto' }}>
      <div className="modal-header">
        <h3>Ajouter un asset à la catégorie</h3>
        <button className="modal-close" onClick={() => setShowAddAssetModal(false)}>×</button>
      </div>
      <div className="modal-body">
        {/* Barre de recherche et filtres */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <MdSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="text"
                placeholder="Rechercher un asset sans catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
              {searchTerm && (
                <MdClose
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 8,
                color: 'white',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">📁 Tous les types</option>
              <option value="image">🖼️ Images</option>
              <option value="3d_model">🎮 Modèles 3D</option>
              <option value="video">🎬 Vidéos</option>
              <option value="audio">🎵 Audio</option>
              <option value="document">📄 Documents</option>
              <option value="other">📎 Autres</option>
            </select>

            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 8,
                color: 'white',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">👁️ Toutes visibilités</option>
              <option value="public">🌍 Public</option>
              <option value="team">👥 Team</option>
              <option value="private">🔒 Privé</option>
            </select>

            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 8,
                color: 'white',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
                maxWidth: 200
              }}
            >
              <option value="all">👤 Tous les créateurs</option>
              {loadingUsers ? (
                <option value="" disabled>Chargement...</option>
              ) : (
                users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name || user.name || user.email || `ID: ${user.id}`}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--dim)' }}>
            {availableAssets.length === 0 ? (
              <span>✅ Tous les assets ont déjà une catégorie</span>
            ) : (
              <span>📊 {filteredAvailableAssets.length} asset(s) sans catégorie disponible(s)</span>
            )}
          </div>
        </div>

        {loadingAvailable ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="loading-spinner">Chargement des assets disponibles...</div>
          </div>
        ) : filteredAvailableAssets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 14, color: 'var(--dim)', marginBottom: 8 }}>
              {availableAssets.length === 0 ? 'Tous les assets ont déjà une catégorie' : 'Aucun asset ne correspond aux filtres'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {availableAssets.length === 0
                ? 'Les assets ne peuvent être ajoutés que s\'ils n\'ont pas de catégorie'
                : 'Essayez de modifier vos filtres de recherche'
              }
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
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
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {filteredAvailableAssets.map((asset) => {
              const is3D = is3DModel(asset);
              const assetDisplayName = asset.title || asset.name;
              
              // Fonction pour construire l'URL de capture
              const getCaptureUrl = (capturePath) => {
                if (!capturePath) return null;
                // Si le chemin commence déjà par http, on le retourne tel quel
                if (capturePath.startsWith('http')) return capturePath;
                // Sinon on construit l'URL complète
                const baseUrl = API_BASE_URL.replace('/api', '');
                return `${baseUrl}${capturePath}`;
              };

              const captureUrl = getCaptureUrl(asset.capture_url);

              return (
                <div
                  key={asset.id}
                  className="available-asset-card"
                  style={{
                    background: 'rgba(0,0,0,.3)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,.06)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, border-color 0.2s'
                  }}
                  onClick={() => handleAddAsset(asset.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)';
                  }}
                >
                  {/* Zone de preview avec capture */}
                  <div style={{
                    height: 160,
                    background: 'rgba(0,0,0,.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {captureUrl ? (
                      <img
                        src={captureUrl}
                        alt={`Aperçu de ${assetDisplayName}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                        onError={(e) => {
                          // En cas d'erreur de chargement de l'image, afficher l'icône par défaut
                          e.target.style.display = 'none';
                          const defaultIcon = e.target.parentElement.querySelector('.default-icon');
                          if (defaultIcon) {
                            defaultIcon.style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="default-icon" style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                      }}>
                        {is3D ? (
                          <PiCubeLight size={48} style={{ opacity: 0.6 }} />
                        ) : asset.file_type === 'image' ? (
                          <MdImage size={48} style={{ opacity: 0.6 }} />
                        ) : asset.file_type === 'video' ? (
                          <MdVideoLibrary size={48} style={{ opacity: 0.6 }} />
                        ) : (
                          <FaRegFile size={48} style={{ opacity: 0.6 }} />
                        )}
                        <span style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                          {is3D ? 'Modèle 3D' : 
                           asset.file_type === 'image' ? 'Image' :
                           asset.file_type === 'video' ? 'Vidéo' : 
                           asset.file_type || 'Fichier'}
                        </span>
                      </div>
                    )}

                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(0,0,0,.7)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      color: '#3B82F6'
                    }}>
                      {asset.file_type === '3d_model' ? '3D' :
                       asset.file_type === 'image' ? 'IMAGE' :
                       asset.file_type === 'video' ? 'VIDÉO' :
                       asset.file_type?.toUpperCase() || 'FICHIER'}
                    </div>

                    <div style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      background: 'rgba(16,185,129,.9)',
                      padding: '2px 10px',
                      borderRadius: 12,
                      fontSize: 10,
                      color: 'white'
                    }}>
                      ✓ Sans catégorie
                    </div>
                  </div>

                  <div style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, color: 'white' }}>
                      {assetDisplayName}
                    </div>
                    <div style={{ fontSize: 10, color: '#666', marginBottom: 6 }}>
                      {formatSize(asset.file_size)} • {formatDate(asset.created_at)}
                    </div>
                    {asset.description && (
                      <div style={{
                        fontSize: 10,
                        color: '#888',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 8
                      }}>
                        {asset.description}
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid rgba(255,255,255,.06)'
                    }}>
                      <div style={{
                        background: 'rgba(59,130,246,.15)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        color: '#3B82F6'
                      }}>
                        {asset.visibility === 'public' ? '🌍 Public' :
                         asset.visibility === 'team' ? '👥 Team' : '🔒 Privé'}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: '#666',
                        marginLeft: 'auto'
                      }}>
                        {asset.created_by_name || asset.uploaded_by_name || `ID: ${asset.created_by || asset.user_id}`}
                      </div>
                      <button
                        style={{
                          background: '#3B82F6',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <MdAdd size={12} />
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* Modal de confirmation retrait */}
      {showConfirmModal && assetToDelete && (
        <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Confirmer le retrait</h3>
              <button className="modal-close" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>×</button>
            </div>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir retirer <strong>{assetToDelete.name}</strong> de cette catégorie ?</p>
              <p style={{ fontSize: 12, color: 'var(--dim)', marginTop: 8 }}>
                L'asset restera disponible dans la bibliothèque.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>Annuler</button>
              <button className="modal-btn modal-btn-delete" onClick={handleRemoveAsset} style={{ background: 'rgba(220,38,38,.1)', border: 'none', padding: '8px 16px', borderRadius: 6, color: '#ef4444', cursor: 'pointer' }}>Retirer</button>
            </div>
          </div>
        </div>
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
          border-radius: 16px;
          width: 90%;
          max-width: 900px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
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
          font-size: 18px;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-muted);
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(255,255,255,.1);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .modal-btn {
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .modal-btn-cancel {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          color: var(--text);
        }

        .modal-btn-cancel:hover {
          background: rgba(255,255,255,.1);
        }

        .btn-primary {
          background: #3B82F6;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .available-asset-card {
          cursor: pointer;
        }

        .loading-spinner {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--dim);
        }

        select option {
          background: #0a0f1a;
          color: white;
        }
      `}</style>
    </>
  );
}