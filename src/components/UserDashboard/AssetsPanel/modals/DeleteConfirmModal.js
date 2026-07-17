// src/components/UserDashboard/modals/DeleteConfirmModal.jsx

import React from 'react';

export default function DeleteConfirmModal({ showConfirmModal, assetToDelete, onCancel, onConfirm }) {
  if (!showConfirmModal || !assetToDelete) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirmer la suppression</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer <strong>{assetToDelete.name}</strong> ?</p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>Annuler</button>
          <button className="modal-btn modal-btn-delete" onClick={onConfirm}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}