// components/AdminDashboard/AssetsPanel/ConfirmModal.jsx

const ConfirmModal = ({ isOpen, assetName, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirmer la suppression</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer <strong>{assetName}</strong> ?</p>
          <p style={{ fontSize: 12, color: '#ef4444' }}>Cette action est irréversible.</p>
        </div>
        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-cancel"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,.1)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <button
            className="modal-btn modal-btn-delete"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#ef4444',
              color: 'white',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1
            }}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;