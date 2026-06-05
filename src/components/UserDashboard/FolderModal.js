// src/components/UserDashboard/FolderModal.jsx
import React from 'react';

export default function FolderModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container">
        <div className="modal-title">Nouveau dossier</div>
        <div className="form-field">
          <label className="form-label">Nom du projet</label>
          <input className="form-input" placeholder="Ex: API Gateway v4" />
        </div>
        <div className="form-field">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="2" placeholder="Optionnel…" style={{ resize: 'none' }} />
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-confirm">Créer</button>
        </div>
      </div>
    </div>
  );
}