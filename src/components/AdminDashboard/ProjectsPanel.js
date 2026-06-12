// src/components/UserDashboard/ProjectsPanel.jsx
import React, { useState, useEffect } from 'react';
import { MdOutlineModeEditOutline } from "react-icons/md";
import { MdOutlineDeleteForever } from "react-icons/md";
import { MdOutlineVisibility } from "react-icons/md";
import { MdDownload } from "react-icons/md";
import { MdAdd } from "react-icons/md";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

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

// Composant pour la gestion des assets d'un projet
function ProjectAssetsModal({ project, onClose, onAssetUpdate }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // Charger les assets du projet
  const fetchProjectAssets = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/projects/${project.id}/assets`);
      
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
    } finally {
      setLoading(false);
    }
  };

  // Charger tous les assets disponibles pour l'ajout
  const fetchAvailableAssets = async () => {
    try {
      setLoadingAvailable(true);
      // Supposons qu'il y a un endpoint GET /api/assets pour lister tous les assets
      const data = await apiRequest('/assets');
      
      let allAssets = [];
      if (Array.isArray(data)) {
        allAssets = data;
      } else if (data.assets && Array.isArray(data.assets)) {
        allAssets = data.assets;
      } else if (data.data && Array.isArray(data.data)) {
        allAssets = data.data;
      }
      
      // Filtrer les assets déjà dans le projet
      const projectAssetIds = new Set(assets.map(a => a.id));
      const available = allAssets.filter(asset => !projectAssetIds.has(asset.id));
      setAvailableAssets(available);
    } catch (err) {
      console.error("Erreur lors du chargement des assets disponibles:", err);
      setError(err.message || "Impossible de charger les assets disponibles");
    } finally {
      setLoadingAvailable(false);
    }
  };

  useEffect(() => {
    fetchProjectAssets();
  }, [project.id]);

  // Ajouter un asset au projet
  const handleAddAsset = async (assetId) => {
    try {
      await apiRequest(`/projects/${project.id}/assets/${assetId}`, {
        method: 'POST'
      });
      
      await fetchProjectAssets();
      setShowAddAssetModal(false);
      if (onAssetUpdate) onAssetUpdate();
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'asset:", err);
      setError(err.message || "Erreur lors de l'ajout de l'asset");
    }
  };

  // Retirer un asset du projet
  const handleRemoveAsset = async (assetId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer cet asset du projet ?')) {
      return;
    }
    
    try {
      await apiRequest(`/projects/${project.id}/assets/${assetId}`, {
        method: 'DELETE'
      });
      
      await fetchProjectAssets();
      if (onAssetUpdate) onAssetUpdate();
    } catch (err) {
      console.error("Erreur lors du retrait de l'asset:", err);
      setError(err.message || "Erreur lors du retrait de l'asset");
    }
  };

  // Télécharger un asset
  const handleDownloadAsset = (asset) => {
    // Construire l'URL de téléchargement
    const downloadUrl = `${API_BASE_URL}/assets/${asset.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  // Modifier un asset (rediriger vers l'éditeur ou ouvrir un modal)
  const handleEditAsset = (asset) => {
    // Option 1: Ouvrir un modal d'édition
    setEditingAsset(asset);
    // Option 2: Rediriger vers une page d'édition
    // window.location.href = `/assets/${asset.id}/edit`;
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, width: '90%' }}>
          <div className="modal-header">
            <h3>Assets du projet : {project.name}</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          
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
            
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--dim)' }}>
                {assets.length} asset{assets.length !== 1 ? 's' : ''} dans ce projet
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  fetchAvailableAssets();
                  setShowAddAssetModal(true);
                }}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                <MdAdd style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Ajouter un asset
              </button>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="loading-spinner">Chargement des assets...</div>
              </div>
            ) : assets.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: 'rgba(12,22,40,.6)',
                borderRadius: 12,
                border: '1px dashed rgba(255,255,255,.1)'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5, marginBottom: 16 }}>
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <div style={{ fontSize: 14, color: 'var(--dim)', marginBottom: 8 }}>Aucun asset</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Ajoutez des assets à ce projet</div>
                <button className="btn btn-primary" onClick={() => {
                  fetchAvailableAssets();
                  setShowAddAssetModal(true);
                }}>
                  + Ajouter un asset
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {assets.map((asset) => (
                  <div 
                    key={asset.id}
                    style={{
                      background: 'rgba(12,22,40,.8)',
                      border: '1px solid rgba(255,255,255,.06)',
                      borderRadius: 10,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontFamily: "'Syne', sans-serif", 
                        fontSize: 13, 
                        fontWeight: 600,
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        {asset.title}
                        <span style={{ 
                          fontSize: 9, 
                          background: 'rgba(59,130,246,.2)', 
                          color: '#3B82F6',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontFamily: "'JetBrains Mono', monospace"
                        }}>
                          {asset.type || 'fichier'}
                        </span>
                      </div>
                      {asset.description && (
                        <div style={{ fontSize: 11, color: 'var(--dim)' }}>
                          {asset.description}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                        Taille: {asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : 'N/A'} | 
                        Modifié: {asset.updated_at ? new Date(asset.updated_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                      <button
                        onClick={() => handleDownloadAsset(asset)}
                        style={{
                          background: 'rgba(16,185,129,.15)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: '#10B981',
                          fontSize: 12,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Télécharger"
                      >
                        <MdDownload />
                        Télécharger
                      </button>
                      
                      <button
                        onClick={() => handleEditAsset(asset)}
                        style={{
                          background: 'rgba(59,130,246,.15)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: '#3B82F6',
                          fontSize: 12,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Modifier"
                      >
                        <MdOutlineModeEditOutline />
                        Modifier
                      </button>
                      
                      <button
                        onClick={() => handleRemoveAsset(asset.id)}
                        style={{
                          background: 'rgba(239,68,68,.15)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: '#EF4444',
                          fontSize: 12,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Retirer du projet"
                      >
                        <MdOutlineDeleteForever />
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal pour ajouter un asset */}
      {showAddAssetModal && (
        <div className="modal-overlay" onClick={() => setShowAddAssetModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Ajouter un asset au projet</h3>
              <button className="modal-close" onClick={() => setShowAddAssetModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {loadingAvailable ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner">Chargement des assets disponibles...</div>
                </div>
              ) : availableAssets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: 14, color: 'var(--dim)', marginBottom: 8 }}>Aucun asset disponible</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tous les assets sont déjà dans ce projet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {availableAssets.map((asset) => (
                    <div 
                      key={asset.id}
                      style={{
                        background: 'rgba(12,22,40,.8)',
                        border: '1px solid rgba(255,255,255,.06)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleAddAsset(asset.id)}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {asset.title}
                        </div>
                        {asset.description && (
                          <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                            {asset.description}
                          </div>
                        )}
                      </div>
                      <button
                        style={{
                          background: 'rgba(59,130,246,.2)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          cursor: 'pointer',
                          color: '#3B82F6',
                          fontSize: 12
                        }}
                      >
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal d'édition d'asset (simplifié) */}
      {editingAsset && (
        <div className="modal-overlay" onClick={() => setEditingAsset(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Modifier l'asset</h3>
              <button className="modal-close" onClick={() => setEditingAsset(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ marginBottom: 16 }}>Fonctionnalité d'édition à implémenter</p>
                <pre style={{ background: 'rgba(0,0,0,.3)', padding: 12, borderRadius: 6, fontSize: 11, textAlign: 'left' }}>
                  {JSON.stringify(editingAsset, null, 2)}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => setEditingAsset(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .modal-container {
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .modal-body {
          max-height: calc(80vh - 120px);
          overflow-y: auto;
        }
      `}</style>
    </>
  );
}

export default function ProjectsPanel() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  
  // Charger les projets depuis l'API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest('/projects');
      
      let projectsList = [];
      if (Array.isArray(data)) {
        projectsList = data;
      } else if (data.projects && Array.isArray(data.projects)) {
        projectsList = data.projects;
      } else if (data.data && Array.isArray(data.data)) {
        projectsList = data.data;
      }
      
      setProjects(projectsList);
    } catch (err) {
      console.error("Erreur lors du chargement des projets:", err);
      setError(err.message || "Impossible de charger les projets");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  // Ouvrir le modal des assets
  const handleViewAssets = (project) => {
    setSelectedProject(project);
    setShowAssetsModal(true);
  };
  
  // Générer une couleur basée sur l'ID (avec valeur par défaut)
  const getProjectColor = (id) => {
    const colors = [
      { bg: 'rgba(59,130,246,.15)', color: '#3B82F6' },  // Bleu
      { bg: 'rgba(16,185,129,.15)', color: '#10B981' },  // Vert
      { bg: 'rgba(139,92,246,.15)', color: '#8B5CF6' },  // Violet
      { bg: 'rgba(245,158,11,.15)', color: '#F59E0B' },  // Orange
      { bg: 'rgba(239,68,68,.15)', color: '#EF4444' },   // Rouge
      { bg: 'rgba(71,85,105,.2)', color: '#9CA3AF' },    // Gris
      { bg: 'rgba(6,182,212,.15)', color: '#06B6D4' },   // Cyan
      { bg: 'rgba(236,72,153,.15)', color: '#EC4899' },  // Rose
    ];
    const index = (id && typeof id === 'number') ? id % colors.length : 0;
    return colors[index];
  };
  
  // Gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du projet est requis';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Créer un nouveau projet via API
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const data = await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null
        })
      });
      
      const newProject = data.project || data.data || data;
      setProjects(prev => [newProject, ...prev]);
      closeModal();
      
      console.log('Projet créé avec succès:', newProject);
    } catch (err) {
      console.error("Erreur lors de la création:", err);
      setError(err.message || "Erreur lors de la création du projet");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Modifier un projet
  const handleEditProject = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || ''
    });
    setErrors({});
    setShowModal(true);
  };
  
  // Mettre à jour un projet via API
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const data = await apiRequest(`/projects/${editingProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null
        })
      });
      
      const updatedProject = data.project || data.data || data;
      
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id ? { ...p, ...updatedProject } : p
      ));
      closeModal();
      
      console.log('Projet modifié avec succès:', updatedProject);
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      setError(err.message || "Erreur lors de la modification du projet");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Supprimer un projet via API
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await apiRequest(`/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
      console.log('Projet supprimé:', projectId);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      setError(err.message || "Erreur lors de la suppression du projet");
    }
  };
  
  // Fermer le modal et réinitialiser
  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: ''
    });
    setErrors({});
    setError(null);
  };
  
  // Ouvrir le modal pour création
  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: ''
    });
    setErrors({});
    setError(null);
    setShowModal(true);
  };
  
  if (loading && projects.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="loading-spinner">Chargement des projets...</div>
      </div>
    );
  }
  
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span className="card-title" style={{ fontSize: 14 }}>Mes projets</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>
            {projects.length} {projects.length === 1 ? 'dossier' : 'dossiers'}
          </span>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nouveau projet
        </button>
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
      
      {projects.length === 0 && !loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'rgba(12,22,40,.6)',
          borderRadius: 12,
          border: '1px dashed rgba(255,255,255,.1)'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5, marginBottom: 16 }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <div style={{ fontSize: 14, color: 'var(--dim)', marginBottom: 8 }}>Aucun projet</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Créez votre premier projet pour commencer</div>
          <button className="btn btn-primary" onClick={openCreateModal} style={{ padding: '8px 16px', fontSize: 12 }}>
            + Créer un projet
          </button>
        </div>
      ) : (
        <div className="proj-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
          gap: 12, 
          marginBottom: 16 
        }}>
          {projects.map((project, index) => {
            const colors = getProjectColor(project.id || index + 1);
            return (
              <div 
                key={project.id || index} 
                className="proj" 
                style={{ 
                  background: 'rgba(12,22,40,.8)', 
                  border: '1px solid rgba(255,255,255,.06)', 
                  borderRadius: 12, 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => console.log('Ouvrir projet:', project.id)}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  zIndex: 10,
                  display: 'flex',
                  gap: 4
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewAssets(project);
                    }}
                    style={{
                      background: 'rgba(59,130,246,.5)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      color: '#fff',
                      fontSize: 11,
                      transition: 'all 0.2s'
                    }}
                    title="Voir les assets"
                  >
                    <MdOutlineVisibility />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProject(project);
                    }}
                    style={{
                      background: 'rgba(0,0,0,.5)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      transition: 'all 0.2s'
                    }}
                    title="Modifier"
                  >
                   <MdOutlineModeEditOutline />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (project.id) handleDeleteProject(project.id);
                    }}
                    style={{
                      background: 'rgba(0,0,0,.5)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      transition: 'all 0.2s'
                    }}
                    title="Supprimer"
                  >
                    <MdOutlineDeleteForever />
                  </button>
                </div>
                
                <div className="proj-cover" style={{ 
                  height: 68, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: colors.bg, 
                  position: 'relative' 
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={colors.color} strokeWidth="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="proj-body" style={{ padding: '12px 14px' }}>
                  <div className="proj-name" style={{ 
                    fontFamily: "'Syne', sans-serif", 
                    fontSize: 13, 
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 4
                  }} title={project.name}>
                    {project.name}
                  </div>
                  {project.description && (
                    <div className="proj-desc" style={{ 
                      fontSize: 10, 
                      color: 'var(--dim)', 
                      marginTop: 6,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }} title={project.description}>
                      {project.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <div 
            className="proj proj-new"  
            style={{ 
              cursor: 'pointer', 
              borderStyle: 'dashed', 
              opacity: 0.35, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: 182,
              transition: 'all 0.2s ease',
              background: 'rgba(12,22,40,.8)',
              border: '1px solid rgba(255,255,255,.06)',
              borderRadius: 12
            }}
            onClick={openCreateModal}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Nouveau projet</div>
          </div>
        </div>
      )}
      
      {/* Modal de création/édition de projet */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{editingProject ? 'Modifier le projet' : 'Nouveau projet'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject}>
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
                
                <div className="form-group">
                  <label className="field-label">
                    Nom du projet <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className={`field-input ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ex: API Gateway v3"
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
                
                <div className="form-group">
                  <label className="field-label">Description</label>
                  <textarea
                    name="description"
                    className="field-input"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Décrivez brièvement votre projet..."
                    rows="4"
                    style={{ resize: 'vertical' }}
                  />
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
                  disabled={submitting || !formData.name.trim()}
                >
                  {submitting ? 'Chargement...' : (editingProject ? 'Mettre à jour' : 'Créer le projet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de gestion des assets */}
      {showAssetsModal && selectedProject && (
        <ProjectAssetsModal 
          project={selectedProject}
          onClose={() => setShowAssetsModal(false)}
          onAssetUpdate={fetchProjects}
        />
      )}
      
      <style>{`
        .proj:hover {
          transform: translateY(-2px);
          border-color: rgba(59,130,246,.3) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,.3);
        }
        
        .proj-new:hover {
          opacity: 0.6 !important;
          transform: translateY(-2px);
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
      `}</style>
    </>
  );
}