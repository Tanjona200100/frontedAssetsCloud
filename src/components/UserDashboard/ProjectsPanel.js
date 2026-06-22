// src/components/UserDashboard/ProjectsPanel.jsx
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../pages/UserDashboard';
import { MdOutlineModeEditOutline } from "react-icons/md";
import { MdOutlineDeleteForever } from "react-icons/md";
import { MdOutlineVisibility } from "react-icons/md";

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

export default function ProjectsPanel() {
  const { openProjectAssets, userData } = useContext(UserContext);
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
  
  // Vérifier si l'utilisateur est admin
  const isAdmin = userData?.role === 'admin' || userData?.is_admin === true;
  
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
  
  // Fonction pour ouvrir un projet et voir ses assets
  const handleOpenProject = (project) => {
    console.log('🔵 Projet cliqué:', project);
    if (openProjectAssets && project && project.id) {
      openProjectAssets(project.id);
    } else {
      // Fallback si la fonction n'est pas disponible
      console.error('❌ openProjectAssets non disponible');
    }
  };
  
  // Télécharger un projet (gestion d'erreur améliorée)
  const handleDownloadProject = async (project) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/projects/${project.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Fonctionnalité de téléchargement non disponible pour ce projet');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
      setError(err.message || "Erreur lors du téléchargement du projet");
    }
  };
  
  // Générer une couleur basée sur l'ID
  const getProjectColor = (id) => {
    const colors = [
      { bg: 'rgba(59,130,246,.15)', color: '#3B82F6' },
      { bg: 'rgba(16,185,129,.15)', color: '#10B981' },
      { bg: 'rgba(139,92,246,.15)', color: '#8B5CF6' },
      { bg: 'rgba(245,158,11,.15)', color: '#F59E0B' },
      { bg: 'rgba(239,68,68,.15)', color: '#EF4444' },
      { bg: 'rgba(71,85,105,.2)', color: '#9CA3AF' },
      { bg: 'rgba(6,182,212,.15)', color: '#06B6D4' },
      { bg: 'rgba(236,72,153,.15)', color: '#EC4899' },
    ];
    const index = (id && typeof id === 'string') ? id.length % colors.length : 0;
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
  
  // Créer un nouveau projet (admin uniquement)
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setError('Vous n\'avez pas les droits pour créer un projet');
      return;
    }
    
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
  
  // Modifier un projet (admin uniquement)
  const handleEditProject = (project) => {
    if (!isAdmin) {
      setError('Vous n\'avez pas les droits pour modifier un projet');
      return;
    }
    
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || ''
    });
    setErrors({});
    setShowModal(true);
  };
  
  // Mettre à jour un projet (admin uniquement)
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setError('Vous n\'avez pas les droits pour modifier un projet');
      return;
    }
    
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
  
  // Supprimer un projet (admin uniquement)
  const handleDeleteProject = async (projectId) => {
    if (!isAdmin) {
      setError('Vous n\'avez pas les droits pour supprimer un projet');
      return;
    }
    
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
  
  // Ouvrir le modal pour création (admin uniquement)
  const openCreateModal = () => {
    if (!isAdmin) {
      setError('Vous n\'avez pas les droits pour créer un projet');
      return;
    }
    
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
            {projects.length} {projects.length === 1 ? 'projet' : 'projets'}
          </span>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Nouveau projet
          </button>
        )}
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            {isAdmin ? 'Créez votre premier projet pour commencer' : 'Aucun projet disponible'}
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreateModal} style={{ padding: '8px 16px', fontSize: 12 }}>
              + Créer un projet
            </button>
          )}
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
                onClick={() => handleOpenProject(project)}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  zIndex: 10,
                  display: 'flex',
                  gap: 4
                }}>
                  {/* Voir les assets - accessible à tous */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProject(project);
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
                    <MdOutlineVisibility size={14} />
                  </button>

                  
                  {/* Modifier - admin uniquement */}
                  {isAdmin && (
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
                      <MdOutlineModeEditOutline size={14} />
                    </button>
                  )}
                  
                  {/* Supprimer - admin uniquement */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
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
                      <MdOutlineDeleteForever size={14} />
                    </button>
                  )}
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
          
          {/* Nouveau projet - admin uniquement */}
          {isAdmin && (
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
          )}
        </div>
      )}
      
      {/* Modal de création/édition de projet - admin uniquement */}
      {showModal && isAdmin && (
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
          max-width: 500px;
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
        
        .modal-btn-validate {
          background: rgba(59,130,246,.15);
          border: 1px solid rgba(59,130,246,.3);
          color: #3B82F6;
        }
        
        .modal-btn-validate:hover:not(:disabled) {
          background: rgba(59,130,246,.25);
        }
        
        .modal-btn-validate:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 6px;
          color: var(--text-muted);
        }
        
        .field-input {
          width: 100%;
          background: rgba(0,0,0,.3);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 8px;
          padding: 10px 12px;
          color: white;
          font-size: 13px;
          transition: all 0.2s;
        }
        
        .field-input:focus {
          outline: none;
          border-color: rgba(59,130,246,.5);
        }
        
        textarea.field-input {
          resize: vertical;
          font-family: inherit;
        }
      `}</style>
    </>
  );
}