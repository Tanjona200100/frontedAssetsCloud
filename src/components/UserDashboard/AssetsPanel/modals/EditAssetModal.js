// src/components/UserDashboard/modals/EditAssetModal.jsx

import React from 'react';
import { LiaGlobeSolid, LiaLockSolid, LiaEditSolid } from 'react-icons/lia';

export default function EditAssetModal({
  showEditModal,
  assetToEdit,
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
  onClose,
  onSubmit,
  projects,
  categories
}) {
  if (!showEditModal || !assetToEdit) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal-container" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <div className="upload-modal-icon">
            <LiaEditSolid size={22} />
          </div>
          <div className="upload-modal-title-section">
            <h3 className="upload-modal-title">Modifier l'asset</h3>
            <p className="upload-modal-subtitle">{assetToEdit.title || assetToEdit.name}</p>
          </div>
          <button className="upload-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="upload-modal-body">
            <div className="upload-metadata">
              <div className="upload-metadata-row">
                <div className="upload-metadata-field">
                  <label className="upload-label">Titre</label>
                  <input type="text" className="upload-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titre de l'asset" />
                </div>
                <div className="upload-metadata-field">
                  <label className="upload-label">Tags (séparés par des virgules)</label>
                  <input type="text" className="upload-input" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="ex: personnage, arme, environnement" />
                </div>
              </div>
              <div className="upload-metadata-row">
                <div className="upload-metadata-field">
                  <label className="upload-label">Projet</label>
                  <select
                    className="upload-select"
                    value={editProject}
                    onChange={(e) => setEditProject(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: 'white', fontSize: 13 }}
                  >
                    <option value="">Aucun projet</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div className="upload-metadata-field">
                  <label className="upload-label">Catégorie</label>
                  <select
                    className="upload-select"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: 'white', fontSize: 13 }}
                  >
                    <option value="">Aucune catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.icon || '🏷️'} {category.display_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="upload-metadata-row">
                <div className="upload-metadata-field">
                  <label className="upload-label">Description</label>
                  <textarea className="upload-textarea" rows="2" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description de l'asset" />
                </div>
                <div className="upload-metadata-field">
                  <label className="upload-label">Visibilité</label>
                  <div className="upload-visibility-options">
                    <label className="upload-radio"><input type="radio" value="public" checked={editVisibility === 'public'} onChange={(e) => setEditVisibility(e.target.value)} /><span><LiaGlobeSolid /> Public</span></label>
                    <label className="upload-radio"><input type="radio" value="private" checked={editVisibility === 'private'} onChange={(e) => setEditVisibility(e.target.value)} /><span><LiaLockSolid /> Privé</span></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="upload-modal-footer">
            <button type="button" className="upload-btn upload-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="upload-btn upload-btn-primary" disabled={editing}>
              {editing ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}