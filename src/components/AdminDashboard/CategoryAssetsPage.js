// src/components/UserDashboard/CategoryAssetsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { MdArrowBack, MdAdd, MdSearch, MdClose } from "react-icons/md";
import { LiaEyeSolid, LiaDownloadSolid, LiaTrashAltSolid, LiaGlobeSolid, LiaLockSolid } from 'react-icons/lia';
import { PiCubeLight } from "react-icons/pi";
import { FaRegFile } from "react-icons/fa6";
import { RiDossierFill } from "react-icons/ri";
import { 
  MdWeb, 
  MdPalette, 
  MdPhoneAndroid, 
  MdBuild, 
  MdBarChart, 
  MdSecurity, 
  MdTrendingUp, 
  MdMenuBook, 
  MdSportsEsports, 
  MdSmartToy, 
  MdCloud, 
  MdInventory,
  MdFolder
} from 'react-icons/md';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

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
    console.error('Erreur lors du parsing user:', e);
  }
  return {};
};

// Fonction améliorée pour vérifier si un asset a une catégorie
const assetHasCategory = (asset) => {
  // Vérifier plusieurs champs possibles
  const categoryFields = ['category_id', 'categoryId', 'category', 'categories', 'category_ids'];
  
  for (const field of categoryFields) {
    const value = asset[field];
    
    // Si le champ n'existe pas, continuer
    if (value === undefined || value === null) continue;
    
    // Si c'est un tableau
    if (Array.isArray(value)) {
      if (value.length > 0) return true;
      continue;
    }
    
    // Si c'est un nombre ou une chaîne
    if (typeof value === 'number' || typeof value === 'string') {
      const strValue = String(value).trim();
      // Ignorer les valeurs vides ou nulles
      if (strValue === '' || strValue === 'null' || strValue === 'undefined' || strValue === '0') {
        continue;
      }
      return true;
    }
    
    // Si c'est un objet (cas où category est un objet avec id)
    if (typeof value === 'object' && value !== null) {
      if (value.id || value.name) return true;
    }
  }
  
  // Vérifier si l'asset a des catégories dans une relation
  if (asset.categories && Array.isArray(asset.categories)) {
    return asset.categories.length > 0;
  }
  
  // Vérifier si l'asset est dans une catégorie via la table de liaison
  if (asset.asset_categories && Array.isArray(asset.asset_categories)) {
    return asset.asset_categories.length > 0;
  }
  
  // Vérifier si l'asset a un champ category_name ou autre
  if (asset.category_name || asset.categoryName || asset.category_display_name) {
    return true;
  }
  
  // Vérifier si l'asset a une catégorie dans ses métadonnées
  if (asset.metadata && typeof asset.metadata === 'object') {
    if (asset.metadata.category_id || asset.metadata.categoryId || asset.metadata.category) {
      return true;
    }
  }
  
  return false;
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
  
  // Charger les utilisateurs depuis l'API
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      // Essayer plusieurs endpoints possibles pour les utilisateurs
      let userData = [];
      
      try {
        // Endpoint 1: /users
        const data = await apiRequest('/users/admin/users');
        if (Array.isArray(data)) {
          userData = data;
        } else if (data.users && Array.isArray(data.users)) {
          userData = data.users;
        } else if (data.data && Array.isArray(data.data)) {
          userData = data.data;
        }
      } catch (err) {
        console.log('Endpoint /users non disponible, essai /admin/users');
        try {
          // Endpoint 2: /admin/users (si admin)
          const data = await apiRequest('/admin/users');
          if (Array.isArray(data)) {
            userData = data;
          } else if (data.users && Array.isArray(data.users)) {
            userData = data.users;
          } else if (data.data && Array.isArray(data.data)) {
            userData = data.data;
          }
        } catch (err2) {
          console.log('Endpoint /admin/users non disponible, essai /auth/users');
          try {
            // Endpoint 3: /auth/users
            const data = await apiRequest('/auth/users');
            if (Array.isArray(data)) {
              userData = data;
            } else if (data.users && Array.isArray(data.users)) {
              userData = data.users;
            } else if (data.data && Array.isArray(data.data)) {
              userData = data.data;
            }
          } catch (err3) {
            console.warn('Aucun endpoint utilisateur trouvé, utilisation des données des assets');
          }
        }
      }
      
      // Formater les utilisateurs
      const formattedUsers = userData.map(user => ({
        id: user.id || user.user_id,
        name: user.name || user.full_name || user.first_name || user.username || user.email || `Utilisateur ${user.id || user.user_id}`,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }));
      
      setUsers(formattedUsers);
      console.log(`👥 ${formattedUsers.length} utilisateurs chargés`);
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
      // En cas d'erreur, on essaie d'extraire les utilisateurs des assets
      try {
        const data = await apiRequest('/assets?limit=1000');
        let allAssets = [];
        if (Array.isArray(data)) {
          allAssets = data;
        } else if (data.assets && Array.isArray(data.assets)) {
          allAssets = data.assets;
        } else if (data.data && Array.isArray(data.data)) {
          allAssets = data.data;
        }
        
        const uniqueUsers = [];
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
        setUsers(Array.from(userMap.values()));
        console.log(`👥 ${userMap.size} utilisateurs extraits des assets`);
      } catch (err2) {
        console.error("Erreur lors de l'extraction des utilisateurs:", err2);
      }
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Charger les informations de la catégorie
  const fetchCategory = async () => {
    if (categoryData) return;
    
    try {
      const data = await apiRequest(`/categories/${categoryId}`);
      const categoryData = data.category || data.data || data;
      setCategory(categoryData);
    } catch (err) {
      console.error("Erreur lors du chargement de la catégorie:", err);
      setError(err.message || "Impossible de charger la catégorie");
    }
  };
  
  // Charger les assets de la catégorie
  const fetchCategoryAssets = async () => {
    try {
      setLoadingAssets(true);
      const data = await apiRequest(`/categories/${categoryId}/assets`);
      
      let assetsList = [];
      if (Array.isArray(data)) {
        assetsList = data;
      } else if (data.assets && Array.isArray(data.assets)) {
        assetsList = data.assets;
      } else if (data.data && Array.isArray(data.data)) {
        assetsList = data.data;
      }
      
      setAssets(assetsList);
    } catch (err) {
      console.error("Erreur lors du chargement des assets:", err);
      setError(err.message || "Impossible de charger les assets");
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };
  
  // Charger tous les assets disponibles pour l'ajout
  const fetchAvailableAssets = async () => {
    try {
      setLoadingAvailable(true);
      const data = await apiRequest('/assets?limit=1000');
      
      let allAssets = [];
      if (Array.isArray(data)) {
        allAssets = data;
      } else if (data.assets && Array.isArray(data.assets)) {
        allAssets = data.assets;
      } else if (data.data && Array.isArray(data.data)) {
        allAssets = data.data;
      }
      
      const categoryAssetIds = new Set(assets.map(a => a.id));
      
      // Filtrer les assets disponibles pour l'ajout à la catégorie
      const available = allAssets.filter(asset => {
        const isInCategory = categoryAssetIds.has(asset.id);
        const hasCategory = assetHasCategory(asset);
        
        // Log pour déboguer
        if (hasCategory) {
          console.log(`❌ Asset "${asset.title || asset.name}" (ID: ${asset.id}) a déjà une catégorie`);
        } else {
          console.log(`✅ Asset "${asset.title || asset.name}" (ID: ${asset.id}) disponible`);
        }
        
        return !isInCategory && !hasCategory;
      });
      
      console.log(`📊 ${available.length} assets disponibles sans catégorie sur ${allAssets.length} au total`);
      setAvailableAssets(available);
    } catch (err) {
      console.error("Erreur lors du chargement des assets disponibles:", err);
      setError(err.message || "Impossible de charger les assets disponibles");
    } finally {
      setLoadingAvailable(false);
    }
  };
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCategory();
      await fetchCategoryAssets();
      await fetchUsers(); // Charger les utilisateurs
      setLoading(false);
    };
    loadData();
  }, [categoryId]);
  
  // Filtrer les assets disponibles
  const filteredAvailableAssets = useMemo(() => {
    return availableAssets.filter(asset => {
      // Recherche par nom
      const searchMatch = searchTerm === '' || 
        (asset.title || asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtre par type
      const typeMatch = filterType === 'all' || asset.file_type === filterType;
      
      // Filtre par visibilité
      const visibilityMatch = filterVisibility === 'all' || asset.visibility === filterVisibility;
      
      // Filtre par utilisateur
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
      
      await fetchCategoryAssets();
      await fetchAvailableAssets();
      setShowAddAssetModal(false);
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'asset:", err);
      setError(err.message || "Erreur lors de l'ajout de l'asset");
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
      console.error("Erreur lors du retrait de l'asset:", err);
      setError(err.message || "Erreur lors du retrait de l'asset");
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
      a.download = assetName;
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
      
      {/* Grille des assets */}
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
                    
                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      borderTop: '1px solid rgba(255,255,255,.06)',
                      paddingTop: 12,
                      marginTop: 4
                    }}>
                      <button
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
                      
                      {/* Bouton Retirer - uniquement si admin ou propriétaire */}
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
      
      {/* Modal d'ajout d'asset avec recherche et filtres */}
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
                  {/* Recherche */}
                  <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <MdSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                      type="text"
                      placeholder="Rechercher un asset..."
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
                  
                  {/* Filtre par type */}
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
                  
                  {/* Filtre par visibilité */}
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
                  
                  {/* Filtre par utilisateur */}
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
              </div>
              
              {loadingAvailable ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div className="loading-spinner">Chargement des assets disponibles...</div>
                </div>
              ) : filteredAvailableAssets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                  <div style={{ fontSize: 14, color: 'var(--dim)', marginBottom: 8 }}>
                    {availableAssets.length === 0 ? 'Aucun asset disponible' : 'Aucun asset ne correspond aux filtres'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {availableAssets.length === 0 
                      ? 'Tous les assets sont déjà dans une catégorie ou dans cette catégorie'
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
                <>
                  <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 12 }}>
                    {filteredAvailableAssets.length} asset{filteredAvailableAssets.length > 1 ? 's' : ''} disponible{filteredAvailableAssets.length > 1 ? 's' : ''}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '16px'
                  }}>
                    {filteredAvailableAssets.map((asset) => {
                      const is3D = is3DModel(asset);
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
                          {/* Zone d'aperçu */}
                          <div style={{
                            height: 160,
                            background: 'rgba(0,0,0,.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            {is3D && asset.capture_url ? (
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
                                  e.target.parentElement.querySelector('.default-icon').style.display = 'flex';
                                }}
                              />
                            ) : is3D ? (
                              <div className="default-icon" style={{ textAlign: 'center' }}>
                                <PiCubeLight size={48} style={{ opacity: 0.6 }} />
                              </div>
                            ) : asset.file_type === 'image' && asset.capture_url ? (
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
                              <div className="default-icon" style={{ textAlign: 'center' }}>
                                <FaRegFile size={48} style={{ opacity: 0.6 }} />
                              </div>
                            )}
                            
                            {/* Badge de type */}
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
                            
                            {/* Indicateur "Sans catégorie" */}
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
                          
                          {/* Informations */}
                          <div style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, color: 'white' }}>
                              {asset.title || asset.name}
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
                </>
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
          font-family: "'JetBrains Mono', monospace";
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