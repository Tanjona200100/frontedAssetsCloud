// src/components/UserDashboard/CategoriesPanel.jsx
import React, { useState } from 'react';

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([
    {
      id: 1,
      name: 'Développement Web',
      description: 'Projets liés au développement web frontend et backend',
      color: '#3B82F6',
      bg: 'rgba(59,130,246,.15)',
      projectCount: 12,
      icon: '🌐',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'Design UI/UX',
      description: 'Interfaces utilisateur et expérience utilisateur',
      color: '#10B981',
      bg: 'rgba(16,185,129,.15)',
      projectCount: 8,
      icon: '🎨',
      createdAt: '2024-01-20'
    },
    {
      id: 3,
      name: 'Mobile Apps',
      description: 'Applications iOS et Android',
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,.15)',
      projectCount: 5,
      icon: '📱',
      createdAt: '2024-02-01'
    },
    {
      id: 4,
      name: 'DevOps',
      description: 'CI/CD, Docker, Kubernetes et automatisation',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,.15)',
      projectCount: 6,
      icon: '⚙️',
      createdAt: '2024-02-10'
    },
    {
      id: 5,
      name: 'Data Science',
      description: 'Analyse de données, Machine Learning et IA',
      color: '#EF4444',
      bg: 'rgba(239,68,68,.12)',
      projectCount: 4,
      icon: '📊',
      createdAt: '2024-02-15'
    },
    {
      id: 6,
      name: 'Sécurité',
      description: 'Tests de sécurité, audits et protection',
      color: '#06B6D4',
      bg: 'rgba(6,182,212,.15)',
      projectCount: 3,
      icon: '🔒',
      createdAt: '2024-02-20'
    },
    {
      id: 7,
      name: 'Marketing Digital',
      description: 'SEO, réseaux sociaux et campagnes',
      color: '#EC4899',
      bg: 'rgba(236,72,153,.15)',
      projectCount: 7,
      icon: '📈',
      createdAt: '2024-02-25'
    },
    {
      id: 8,
      name: 'Documentation',
      description: 'Guides, tutoriels et documentation technique',
      color: '#6B7280',
      bg: 'rgba(107,114,128,.15)',
      projectCount: 9,
      icon: '📚',
      createdAt: '2024-03-01'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#3B82F6'
  });
  const [errors, setErrors] = useState({});

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

  // Icônes disponibles
  const iconsList = [
    { emoji: '🌐', name: 'Web' },
    { emoji: '🎨', name: 'Design' },
    { emoji: '📱', name: 'Mobile' },
    { emoji: '⚙️', name: 'DevOps' },
    { emoji: '📊', name: 'Data' },
    { emoji: '🔒', name: 'Sécurité' },
    { emoji: '📈', name: 'Marketing' },
    { emoji: '📚', name: 'Docs' },
    { emoji: '🎮', name: 'Gaming' },
    { emoji: '🤖', name: 'AI' },
    { emoji: '☁️', name: 'Cloud' },
    { emoji: '📦', name: 'Package' }
  ];

  // Générer un ID unique
  const generateId = () => {
    return Math.max(...categories.map(c => c.id), 0) + 1;
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
    setFormData(prev => ({ ...prev, icon: icon.emoji }));
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la catégorie est requis';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    } else if (!editingCategory && categories.some(c => c.name.toLowerCase() === formData.name.toLowerCase())) {
      newErrors.name = 'Une catégorie avec ce nom existe déjà';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Créer une nouvelle catégorie
  const handleCreateCategory = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const newId = generateId();
    const selectedColor = colorPalette.find(c => c.value === formData.color) || colorPalette[0];
    
    const newCategory = {
      id: newId,
      name: formData.name.trim(),
      description: formData.description.trim() || 'Aucune description',
      color: formData.color,
      bg: selectedColor.bg,
      icon: formData.icon,
      projectCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setCategories([newCategory, ...categories]);
    closeModal();
    console.log('Catégorie créée:', newCategory);
  };

  // Modifier une catégorie
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color
    });
    setShowModal(true);
  };

  // Mettre à jour une catégorie
  const handleUpdateCategory = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const selectedColor = colorPalette.find(c => c.value === formData.color) || colorPalette[0];
    
    const updatedCategories = categories.map(category => {
      if (category.id === editingCategory.id) {
        return {
          ...category,
          name: formData.name.trim(),
          description: formData.description.trim(),
          icon: formData.icon,
          color: formData.color,
          bg: selectedColor.bg,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return category;
    });
    
    setCategories(updatedCategories);
    closeModal();
    console.log('Catégorie modifiée:', editingCategory.id);
  };

  // Supprimer une catégorie
  const handleDeleteCategory = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category.projectCount > 0) {
      alert(`Impossible de supprimer cette catégorie car elle contient ${category.projectCount} projet(s).`);
      return;
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      setCategories(categories.filter(c => c.id !== categoryId));
      console.log('Catégorie supprimée:', categoryId);
    }
  };

  // Fermer le modal
  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '📁',
      color: '#3B82F6'
    });
    setErrors({});
  };

  // Ouvrir le modal pour création
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '📁',
      color: '#3B82F6'
    });
    setErrors({});
    setShowModal(true);
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <span className="card-title" style={{ fontSize: 14 }}>Catégories</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>
            {categories.length} catégories
          </span>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nouvelle catégorie
        </button>
      </div>

      <div className="categories-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: 16 
      }}>
        {categories.map((category) => (
          <div 
            key={category.id} 
            className="category-card"
            style={{ 
              background: 'rgba(12,22,40,.8)', 
              border: `1px solid ${category.color}20`,
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
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
                title="Modifier"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                style={{
                  background: 'rgba(0,0,0,.6)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
                title="Supprimer"
              >
                🗑️
              </button>
            </div>

            <div className="category-header" style={{ 
              padding: '20px 20px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: `1px solid ${category.color}20`
            }}>
              <div className="category-icon" style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: category.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28
              }}>
                {category.icon}
              </div>
              <div>
                <h3 style={{ 
                  fontFamily: "'Syne', sans-serif", 
                  fontSize: 16, 
                  fontWeight: 700,
                  margin: 0,
                  color: category.color
                }}>
                  {category.name}
                </h3>
                <div style={{ 
                  fontFamily: "'JetBrains Mono', monospace", 
                  fontSize: 11, 
                  color: 'var(--dim)',
                  marginTop: 4
                }}>
                  {category.projectCount} projet{category.projectCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="category-body" style={{ padding: '16px 20px' }}>
              <p style={{ 
                fontSize: 12, 
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                margin: 0
              }}>
                {category.description}
              </p>
            </div>

            <div className="category-footer" style={{ 
              padding: '12px 20px',
              borderTop: `1px solid ${category.color}20`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 10, color: 'var(--dim)' }}>
                Créée le {category.createdAt}
              </span>
              <button 
                className="btn-view"
                style={{
                  background: 'transparent',
                  border: `1px solid ${category.color}40`,
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 11,
                  color: category.color,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = `${category.color}20`;
                  e.target.style.borderColor = category.color;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = `${category.color}40`;
                }}
              >
                Voir les projets
              </button>
            </div>
          </div>
        ))}

        {/* Carte "Nouvelle catégorie" */}
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
            marginBottom: 12
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Nouvelle catégorie</div>
          <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>Organisez vos projets</div>
        </div>
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              <div className="modal-body">
                {/* Nom */}
                <div className="form-group">
                  <label className="field-label">
                    Nom de la catégorie <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className={`field-input ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ex: Développement Web"
                    autoComplete="off"
                    autoFocus
                    style={errors.name ? { borderColor: '#EF4444' } : {}}
                  />
                  {errors.name && (
                    <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                      {errors.name}
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

                {/* Icône */}
                <div className="form-group">
                  <label className="field-label">Icône</label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', 
                    gap: 8,
                    marginTop: 8
                  }}>
                    {iconsList.map(icon => (
                      <button
                        key={icon.emoji}
                        type="button"
                        onClick={() => handleIconSelect(icon)}
                        style={{
                          background: formData.icon === icon.emoji ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.05)',
                          border: formData.icon === icon.emoji ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,.1)',
                          borderRadius: 8,
                          padding: '8px',
                          cursor: 'pointer',
                          fontSize: 24,
                          transition: 'all 0.2s'
                        }}
                        title={icon.name}
                      >
                        {icon.emoji}
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
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-validate"
                  disabled={!formData.name.trim()}
                >
                  {editingCategory ? 'Mettre à jour' : 'Créer'}
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
          opacity: 0.8;
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
      `}</style>
    </>
  );
}