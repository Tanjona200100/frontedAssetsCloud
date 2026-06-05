// src/components/UserDashboard/CollectionModal.jsx
import React from 'react';

export default function CollectionModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container">
        <div className="modal-title">Nouvelle collection</div>
        <div className="form-field">
          <label className="form-label">Nom</label>
          <input className="form-input" placeholder="Ex: Identité visuelle" />
        </div>
        <div className="form-field">
          <label className="form-label">Catégorie</label>
          <select className="form-input">
            <option>Branding</option>
            <option>UI/UX</option>
            <option>Illustrations</option>
            <option>Photographies</option>
            <option>3D</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-confirm">Créer</button>
        </div>
      </div>
    </div>
  );
}