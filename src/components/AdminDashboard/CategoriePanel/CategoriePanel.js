// src/components/AdminDashboard/CategoriePanel.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CategoryAssetsPage from './CategoryAssetsPage.js';
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
  MdAdd,
  MdEdit,
  MdDelete,
  MdFolder,
  MdClose
} from 'react-icons/md';

const API_BASE_URL = process.env.REACT_APP_API_URL;

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

// Palette de couleurs disponibles
const colorPalette = [
  { name: 'Bleu', value: '#3B82F6', bg: 'rgba(59,130,246,.15)' },
  { name: 'Vert', value: '#10B981', bg: 'rgba(16,185,129,.15)' },
  { name: 'Violet', value: '#8B5CF6', bg: 'rgba(139,92,246,.15)' },
  { name: 'Orange', value: '#F59E0B', bg: 'rgba(245,158,11,.15)' },
  { name: 'Rouge', value: '#EF4444', bg: 'rgba(239,68,68,.12)' },
  { name: 'Cyan', value: '#06B6D4', bg: 'rgba(6,182,212,.15)' },
  { name: 'Rose', value: '#EC4899', bg: 'rgba(236,72,153,.15)' },
  { name: 'Gris', value: '#6B7280', bg: 'rgba(107,114,128,.15)' }
];

// Icônes disponibles avec composants React
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

export default function CategoriePanel({ searchQuery = '' }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryAssets, setShowCategoryAssets] = useState(false);
  
  // États pour les filtres (sans recherche locale)
  const [filterColor, setFilterColor] = useState('all');
  const [filterSort, setFilterSort] = useState('name');
  
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    icon: 'folder',
    color: '#3B82F6',
    sort_order: 0
  });
  const [errors, setErrors] = useState({});

  // Charger les catégories depuis l'API
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest('/categories');
      
      let categoriesList = [];
      if (Array.isArray(data)) {
        categoriesList = data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categoriesList = data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        categoriesList = data.data;
      }
      
      // Transformer les données pour correspondre au format attendu
      const formattedCategories = categoriesList.map(cat => {
        const colorInfo = colorPalette.find(c => c.value === cat.color) || colorPalette[0];
        return {
          ...cat,
          display_name: cat.display_name || cat.name,
          bg: cat.bg || colorInfo.bg,
          assetCount: cat.asset_count || 0,
          createdAt: cat.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          createdDate: cat.created_at ? new Date(cat.created_at) : new Date()
        };
      });
      
      // Trier par sort_order par défaut
      formattedCategories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      setCategories(formattedCategories);
    } catch (err) {
      console.error("Erreur lors du chargement des catégories:", err);
      setError(err.message || "Impossible de charger les catégories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filtrer et trier les catégories
  const filteredAndSortedCategories = useMemo(() => {
    let result = [...categories];
    
    // Filtre par recherche (via la prop searchQuery de la top bar)
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      result = result.filter(cat => 
        cat.display_name.toLowerCase().includes(term) ||
        cat.name.toLowerCase().includes(term) ||
        (cat.description && cat.description.toLowerCase().includes(term))
      );
    }
    
    // Filtre par couleur
    if (filterColor !== 'all') {
      result = result.filter(cat => cat.color === filterColor);
    }
    
    // Tri
    switch(filterSort) {
      case 'name':
        result.sort((a, b) => a.display_name.localeCompare(b.display_name));
        break;
      case 'date':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'assets':
        result.sort((a, b) => (b.assetCount || 0) - (a.assetCount || 0));
        break;
      default:
        result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
    
    return result;
  }, [categories, searchQuery, filterColor, filterSort]);

  // Ouvrir la page des assets d'une catégorie
  const handleViewCategoryAssets = (category) => {
    setSelectedCategory(category);
    setShowCategoryAssets(true);
  };

  // Revenir à la liste des catégories
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setShowCategoryAssets(false);
    fetchCategories(); // Rafraîchir pour mettre à jour le compteur d'assets
  };

  // Gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Sélectionner une couleur
  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color: color.value }));
  };

  // Sélectionner une icône
  const handleIconSelect = (icon) => {
    setFormData(prev => ({ ...prev, icon: icon.value }));
  };

  // Récupérer l'icône React à afficher
  const getIconComponent = (iconValue) => {
    const icon = iconsList.find(i => i.value === iconValue);
    if (icon) {
      return icon.icon;
    }
    return <MdFolder size={24} />;
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom technique de la catégorie est requis';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    } else if (!/^[a-z0-9_]+$/.test(formData.name)) {
      newErrors.name = 'Le nom technique doit contenir uniquement des lettres minuscules, chiffres et underscores';
    }
    
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Le nom affiché est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Créer une nouvelle catégorie
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const selectedColor = colorPalette.find(c => c.value === formData.color) || colorPalette[0];
      
      const data = await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          display_name: formData.display_name.trim(),
          description: formData.description.trim() || null,
          icon: formData.icon,
          color: formData.color,
          sort_order: formData.sort_order
        })
      });
      
      const newCategory = data.category || data.data || data;
      const formattedCategory = {
        ...newCategory,
        display_name: newCategory.display_name || newCategory.name,
        bg: selectedColor.bg,
        assetCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        createdDate: new Date()
      };
      
      setCategories(prev => [...prev, formattedCategory]);
      closeModal();
      
    } catch (err) {
      console.error("Erreur lors de la création:", err);
      setError(err.message || "Erreur lors de la création de la catégorie");
    } finally {
      setSubmitting(false);
    }
  };

  // Modifier une catégorie
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      display_name: category.display_name || category.name,
      description: category.description || '',
      icon: category.icon || 'folder',
      color: category.color || '#3B82F6',
      sort_order: category.sort_order || 0
    });
    setShowModal(true);
  };

  // Mettre à jour une catégorie
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const selectedColor = colorPalette.find(c => c.value === formData.color) || colorPalette[0];
      
      const data = await apiRequest(`/categories/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name.trim(),
          display_name: formData.display_name.trim(),
          description: formData.description.trim() || null,
          icon: formData.icon,
          color: formData.color,
          sort_order: formData.sort_order
        })
      });
      
      const updatedCategory = data.category || data.data || data;
      
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? {
          ...cat,
          ...updatedCategory,
          display_name: updatedCategory.display_name || updatedCategory.name,
          bg: selectedColor.bg,
          updatedAt: new Date().toISOString().split('T')[0]
        } : cat
      ));
      closeModal();
      
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      setError(err.message || "Erreur lors de la modification de la catégorie");
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer une catégorie
  const handleDeleteCategory = async (categoryId, categoryName, assetCount) => {
    if (assetCount > 0) {
      alert(`Impossible de supprimer cette catégorie car elle contient ${assetCount} asset(s).`);
      return;
    }
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?`)) {
      return;
    }
    
    try {
      await apiRequest(`/categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      setError(err.message || "Erreur lors de la suppression de la catégorie");
    }
  };

  // Fermer le modal
  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      icon: 'folder',
      color: '#3B82F6',
      sort_order: 0
    });
    setErrors({});
    setError(null);
  };

  // Ouvrir le modal pour création
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      icon: 'folder',
      color: '#3B82F6',
      sort_order: categories.length // Mettre à la fin par défaut
    });
    setErrors({});
    setError(null);
    setShowModal(true);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilterColor('all');
    setFilterSort('name');
  };

  // Si on affiche les assets d'une catégorie
  if (showCategoryAssets && selectedCategory) {
    return (
      <CategoryAssetsPage 
        categoryId={selectedCategory.id}
        categoryData={selectedCategory}
        onBack={handleBackToCategories}
      />
    );
  }

  if (loading && categories.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
        <div className="loading-spinner">Chargement des catégories...</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span className="card-title" style={{ fontSize: 14 }}>Catégories d'assets</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>
            {filteredAndSortedCategories.length} catégorie{filteredAndSortedCategories.length > 1 ? 's' : ''}
            {categories.length !== filteredAndSortedCategories.length && ` (${categories.length} total)`}
            {searchQuery && ` • Résultat de recherche`}
          </span>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MdAdd size={16} />
          Nouvelle catégorie
        </button>
      </div>

      {/* Filtres (sans barre de recherche) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filtre par couleur */}
          <select
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
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
            <option value="all">🎨 Toutes les couleurs</option>
            {colorPalette.map(color => (
              <option key={color.value} value={color.value}>
                {color.name}
              </option>
            ))}
          </select>
          
          {/* Filtre de tri */}
          <select
            value={filterSort}
            onChange={(e) => setFilterSort(e.target.value)}
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
            <option value="name">🔤 Trier par nom</option>
            <option value="date">📅 Trier par date</option>
            <option value="assets">📊 Trier par nombre d'assets</option>
          </select>
          
          {/* Bouton réinitialiser */}
          {(filterColor !== 'all' || filterSort !== 'name') && (
            <button
              onClick={resetFilters}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 8,
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

      {error && (
        <div style={{ 
          background: 'rgba(239,68,68,.1)', 
          border: '1px solid rgba(239,68,68,.3)',
          borderRadius: 8,
          padding: '10px 15px',
          marginBottom: 16,
          color: '#EF4444',
          fontSize: 12
        }}>
          {error}
        </div>
      )}

      {filteredAndSortedCategories.length === 0 && !loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'rgba(12,22,40,.6)',
          borderRadius: 12,
          border: '1px dashed rgba(255,255,255,.1)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 14, color: 'var(--dim)', marginBottom: 8 }}>
            {searchQuery || filterColor !== 'all' ? 'Aucune catégorie ne correspond aux filtres' : 'Aucune catégorie d\'assets'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            {searchQuery || filterColor !== 'all' 
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Créez votre première catégorie pour organiser vos assets'
            }
          </div>
          {(searchQuery || filterColor !== 'all') ? (
            <button 
              className="btn btn-primary" 
              onClick={resetFilters}
              style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <MdClose size={16} />
              Réinitialiser les filtres
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openCreateModal} style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdAdd size={16} />
              Créer une catégorie
            </button>
          )}
        </div>
      ) : (
        <div className="categories-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 16 
        }}>
          {filteredAndSortedCategories.map((category) => (
            <div 
              key={category.id} 
              className="category-card"
              style={{ 
                background: 'rgba(12,22,40,.8)', 
                border: `1px solid ${category.color || '#3B82F6'}20`,
                borderRadius: 12, 
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 12, 
                right: 12, 
                zIndex: 10,
                display: 'flex',
                gap: 6
              }}>
                <button
                  onClick={() => handleEditCategory(category)}
                  style={{
                    background: 'rgba(0,0,0,.6)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Modifier"
                >
                  <MdEdit size={14} />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id, category.display_name, category.assetCount || 0)}
                  style={{
                    background: 'rgba(0,0,0,.6)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Supprimer"
                >
                  <MdDelete size={14} />
                </button>
              </div>

              <div className="category-header" style={{ 
                padding: '20px 20px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderBottom: `1px solid ${category.color || '#3B82F6'}20`
              }}>
                <div className="category-icon" style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: category.bg || 'rgba(59,130,246,.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: category.color || '#3B82F6'
                }}>
                  {getIconComponent(category.icon)}
                </div>
                <div>
                  <h3 style={{ 
                    fontFamily: "'Syne', sans-serif", 
                    fontSize: 16, 
                    fontWeight: 700,
                    margin: 0,
                    color: category.color || '#3B82F6'
                  }}>
                    {category.display_name}
                  </h3>
                  <div style={{ 
                    fontFamily: "'JetBrains Mono', monospace", 
                    fontSize: 11, 
                    color: 'var(--dim)',
                    marginTop: 4
                  }}>
                    {category.assetCount || 0} asset{category.assetCount !== 1 ? 's' : ''}
                  </div>
                  {category.name !== category.display_name && (
                    <div style={{ 
                      fontSize: 9, 
                      color: 'var(--dim)',
                      fontFamily: 'monospace',
                      marginTop: 2
                    }}>
                      {category.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="category-body" style={{ padding: '16px 20px' }}>
                <p style={{ 
                  fontSize: 12, 
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {category.description || 'Aucune description'}
                </p>
              </div>

              <div className="category-footer" style={{ 
                padding: '12px 20px',
                borderTop: `1px solid ${category.color || '#3B82F6'}20`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 10, color: 'var(--dim)' }}>
                  {category.sort_order !== undefined && `Ordre: ${category.sort_order} • `}
                  Créée le {category.createdAt}
                </span>
                <button 
                  className="btn-view"
                  onClick={() => handleViewCategoryAssets(category)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${category.color || '#3B82F6'}40`,
                    borderRadius: 6,
                    padding: '4px 12px',
                    fontSize: 11,
                    color: category.color || '#3B82F6',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${category.color || '#3B82F6'}20`;
                    e.currentTarget.style.borderColor = category.color || '#3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = `${category.color || '#3B82F6'}40`;
                  }}
                >
                  Voir les assets
                </button>
              </div>
            </div>
          ))}

          {/* Carte "Nouvelle catégorie" - seulement si aucun filtre n'est actif */}
          {!searchQuery && filterColor === 'all' && (
            <div 
              className="category-card new-category"
              style={{ 
                cursor: 'pointer', 
                borderStyle: 'dashed', 
                borderColor: 'rgba(255,255,255,.1)',
                background: 'rgba(12,22,40,.6)',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: 220,
                transition: 'all 0.2s ease',
                borderRadius: 12,
                border: '1px dashed rgba(255,255,255,.2)'
              }}
              onClick={openCreateModal}
            >
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                color: 'var(--dim)'
              }}>
                <MdAdd size={24} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Nouvelle catégorie</div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>Organisez vos assets</div>
            </div>
          )}
        </div>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
              <button className="modal-close" onClick={closeModal}><MdClose size={20} /></button>
            </div>
            
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              <div className="modal-body">
                {error && (
                  <div style={{ 
                    background: 'rgba(239,68,68,.1)', 
                    border: '1px solid rgba(239,68,68,.3)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginBottom: 16,
                    color: '#EF4444',
                    fontSize: 12
                  }}>
                    {error}
                  </div>
                )}
                
                {/* Nom technique */}
                <div className="form-group">
                  <label className="field-label">
                    Nom technique <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className={`field-input ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ex: developpement_web (uniquement minuscules, chiffres et underscores)"
                    autoComplete="off"
                    autoFocus
                    disabled={!!editingCategory}
                    style={errors.name ? { borderColor: '#EF4444' } : {}}
                  />
                  {errors.name && (
                    <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                      {errors.name}
                    </div>
                  )}
                </div>

                {/* Nom affiché */}
                <div className="form-group">
                  <label className="field-label">
                    Nom affiché <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    className={`field-input ${errors.display_name ? 'error' : ''}`}
                    value={formData.display_name}
                    onChange={handleInputChange}
                    placeholder="ex: Développement Web"
                    autoComplete="off"
                    style={errors.display_name ? { borderColor: '#EF4444' } : {}}
                  />
                  {errors.display_name && (
                    <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                      {errors.display_name}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="field-label">Description</label>
                  <textarea
                    name="description"
                    className="field-input"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Décrivez cette catégorie..."
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Ordre de tri */}
                <div className="form-group">
                  <label className="field-label">Ordre d'affichage</label>
                  <input
                    type="number"
                    name="sort_order"
                    className="field-input"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
                    Les catégories sont affichées par ordre croissant
                  </div>
                </div>

                {/* Icône */}
                <div className="form-group">
                  <label className="field-label">Icône</label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
                    gap: 8,
                    marginTop: 8
                  }}>
                    {iconsList.map(icon => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => handleIconSelect(icon)}
                        style={{
                          background: formData.icon === icon.value ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.05)',
                          border: formData.icon === icon.value ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,.1)',
                          borderRadius: 8,
                          padding: '10px',
                          cursor: 'pointer',
                          color: formData.icon === icon.value ? '#3B82F6' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title={icon.name}
                      >
                        {icon.icon}
                        <span style={{ fontSize: 10 }}>{icon.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Couleur */}
                <div className="form-group">
                  <label className="field-label">Couleur</label>
                  <div style={{ 
                    display: 'flex', 
                    gap: 12,
                    flexWrap: 'wrap',
                    marginTop: 8
                  }}>
                    {colorPalette.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: color.value,
                          border: formData.color === color.value ? '2px solid white' : '1px solid rgba(255,255,255,.2)',
                          cursor: 'pointer',
                          boxShadow: formData.color === color.value ? '0 0 0 2px rgba(59,130,246,.5)' : 'none',
                          transition: 'all 0.2s'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="modal-btn modal-btn-cancel" 
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-validate"
                  disabled={submitting || !formData.name.trim() || !formData.display_name.trim()}
                >
                  {submitting ? 'Chargement...' : (editingCategory ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .category-card:hover {
          transform: translateY(-2px);
          border-color: rgba(59,130,246,.3) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,.3);
        }
        
        .new-category:hover {
          border-color: rgba(59,130,246,.4) !important;
          background: rgba(12,22,40,.9) !important;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .modal-container {
          animation: fadeIn 0.2s ease;
        }
        
        .field-input.error {
          border-color: #EF4444;
        }
        
        .field-input.error:focus {
          box-shadow: 0 0 0 2px rgba(239,68,68,0.2);
        }
        
        .loading-spinner {
          font-family: "'JetBrains Mono', monospace";
          font-size: 12px;
          color: var(--dim);
        }
        
        .btn-primary {
          background: rgba(59,130,246,.15);
          border: 1px solid rgba(59,130,246,.3);
          border-radius: 8px;
          padding: 8px 16px;
          color: #3B82F6;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
        }
        
        .btn-primary:hover {
          background: rgba(59,130,246,.25);
          transform: translateY(-1px);
        }
        
        select option {
          background: #0a0f1a;
          color: white;
        }
      `}</style>
    </>
  );
}