// components/AdminDashboard/AddUserModal.jsx
const AddUserModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay open" onClick={handleModalClick}>
      <div className="modal">
        <div className="modal-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Ajouter un utilisateur
        </div>
        <div className="field-row">
          <label className="field-label">Prénom</label>
          <input className="field-input" placeholder="Prénom" />
        </div>
        <div className="field-row">
          <label className="field-label">Nom</label>
          <input className="field-input" placeholder="Nom de famille" />
        </div>
        <div className="field-row">
          <label className="field-label">Email</label>
          <input className="field-input" placeholder="email@exemple.com" />
        </div>
        <div className="field-row">
          <label className="field-label">Rôle</label>
          <select className="select-input">
            <option>Graphiste</option>
            <option>Développeur</option>
            <option>Administrateur</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-save">Créer le compte</button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;