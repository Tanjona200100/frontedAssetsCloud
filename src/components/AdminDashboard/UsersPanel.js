// components/AdminDashboard/UsersPanel.jsx
import { useState, useEffect } from "react";
import { MdCheckCircle, MdCancel, MdBlock, MdPlayCircle } from "react-icons/md";
import { FaTrash, FaEdit } from "react-icons/fa";

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
    throw new Error(data.error || 'Une erreur est survenue');
  }
  
  return data;
};

const getRoleClass = (role) => {
  switch (role) {
    case "admin": return "role-badge admin";
    case "developpeur": return "role-badge dev";
    case "graphiste": return "role-badge design";
    default: return "role-badge";
  }
};

const getRoleText = (role) => {
  switch (role) {
    case "admin": return "Admin";
    case "developpeur": return "Développeur";
    case "graphiste": return "Graphiste";
    default: return role;
  }
};

const getAvatarStyle = (role) => {
  const styles = {
    admin: { background: "rgba(59,130,246,0.2)", color: "var(--accent-blue)" },
    developpeur: { background: "rgba(139,92,246,0.2)", color: "#A78BFA" },
    graphiste: { background: "rgba(16,185,129,0.2)", color: "var(--accent-green)" }
  };
  return styles[role] || styles.developpeur;
};

const getStatusText = (status, isActive, isValidated) => {
  if (status === 'suspended') return "Suspendu";
  if (status === 'rejected') return "Rejeté";
  if (status === 'pending') return "En attente";
  if (!isActive) return "Inactif";
  if (!isValidated) return "Non validé";
  return "Actif";
};

const getStatusClass = (status, isActive, isValidated) => {
  if (status === 'suspended') return "status-dot suspended";
  if (status === 'rejected') return "status-dot rejected";
  if (status === 'pending') return "status-dot pending";
  if (!isActive) return "status-dot inactive";
  if (!isValidated) return "status-dot pending";
  return "status-dot active";
};

const UsersPanel = ({ openModal, searchQuery }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  // États pour le modal d'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    status: '',
    is_active: true,
    is_validated: true
  });

const fetchUsers = async () => {
  try {
    setLoading(true);
    // Utiliser l'endpoint qui liste TOUS les utilisateurs
    const data = await apiRequest('/users/admin/users');  // Ou '/admin/users'
    
    // Vérifier la structure de la réponse
    let filteredUsers = [];
    if (data.users) {
      filteredUsers = data.users;
    } else if (data.data) {
      filteredUsers = data.data;
    } else if (Array.isArray(data)) {
      filteredUsers = data;
    }
    
    console.log('Utilisateurs chargés:', filteredUsers); // Debug
    
    // Appliquer les filtres
    if (filterRole) {
      filteredUsers = filteredUsers.filter(user => user.role === filterRole);
    }
    
    if (filterStatus) {
      switch(filterStatus) {
        case 'active':
          filteredUsers = filteredUsers.filter(user => 
            user.is_active && user.is_validated && user.status !== 'suspended' && user.status !== 'rejected'
          );
          break;
        case 'pending':
          filteredUsers = filteredUsers.filter(user => 
            user.status === 'pending' || (!user.is_validated && user.status !== 'rejected')
          );
          break;
        case 'suspended':
          filteredUsers = filteredUsers.filter(user => user.status === 'suspended');
          break;
        case 'rejected':
          filteredUsers = filteredUsers.filter(user => user.status === 'rejected');
          break;
      }
    }
    
    // Filtre de recherche
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }
    
    setUsers(filteredUsers);
    setError(null);
  } catch (err) {
    console.error("Erreur lors du chargement des utilisateurs:", err);
    setError(err.message || "Impossible de charger les utilisateurs");
    setUsers([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus, searchQuery]);

  // Ouvrir la modale de confirmation
  const openConfirmModal = (action, user) => {
    setSelectedUser(user);
    setConfirmAction(action);
    setRejectReason("");
    setShowConfirmModal(true);
  };

  // Fermer la modale
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setSelectedUser(null);
    setRejectReason("");
  };

  // Ouvrir le modal d'édition
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || 'developpeur',
      status: user.status || 'pending',
      is_active: user.is_active !== undefined ? user.is_active : true,
      is_validated: user.is_validated !== undefined ? user.is_validated : false
    });
    setShowEditModal(true);
  };

  // Fermer le modal d'édition
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditFormData({
      first_name: '',
      last_name: '',
      email: '',
      role: '',
      status: '',
      is_active: true,
      is_validated: true
    });
  };

  // Gérer les changements dans le formulaire d'édition
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Mettre à jour l'utilisateur
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setActionLoading(editingUser.id);
    try {
      const data = await apiRequest(`/users/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      if (data.success) {
        await fetchUsers();
        closeEditModal();
        alert('Utilisateur mis à jour avec succès');
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(null);
    }
  };

  // Valider un utilisateur
  const handleValidateUser = async (user, sendEmail = true) => {
    setActionLoading(user.id);
    try {
      const data = await apiRequest(`/admin/users/${user.id}/validate`, {
        method: 'POST',
        body: JSON.stringify({ sendEmail })
      });
      if (data.success) {
        await fetchUsers();
      }
    } catch (err) {
      console.error("Erreur lors de la validation:", err);
      setError(err.message || "Erreur lors de la validation");
    } finally {
      setActionLoading(null);
      closeConfirmModal();
    }
  };

  // Rejeter un utilisateur
  const handleRejectUser = async (user, reason) => {
    if (!reason) {
      setError("Veuillez indiquer une raison pour le rejet");
      return;
    }
    
    setActionLoading(user.id);
    try {
      const data = await apiRequest(`/admin/users/${user.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason, sendEmail: true })
      });
      if (data.success) {
        await fetchUsers();
      }
    } catch (err) {
      console.error("Erreur lors du rejet:", err);
      setError(err.message || "Erreur lors du rejet");
    } finally {
      setActionLoading(null);
      closeConfirmModal();
    }
  };

  // Suspendre un utilisateur
  const handleSuspendUser = async (user, reason) => {
    setActionLoading(user.id);
    try {
      const data = await apiRequest(`/admin/users/${user.id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      if (data.success) {
        await fetchUsers();
      }
    } catch (err) {
      console.error("Erreur lors de la suspension:", err);
      setError(err.message || "Erreur lors de la suspension");
    } finally {
      setActionLoading(null);
      closeConfirmModal();
    }
  };

  // Activer un utilisateur
  const handleActivateUser = async (user) => {
    setActionLoading(user.id);
    try {
      const data = await apiRequest(`/admin/users/${user.id}/activate`, {
        method: 'POST'
      });
      if (data.success) {
        await fetchUsers();
      }
    } catch (err) {
      console.error("Erreur lors de l'activation:", err);
      setError(err.message || "Erreur lors de l'activation");
    } finally {
      setActionLoading(null);
      closeConfirmModal();
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (user) => {
    setActionLoading(user.id);
    try {
      const data = await apiRequest(`/users/admin/users/${user.id}`, {
        method: 'DELETE'
      });
      if (data.success) {
        await fetchUsers();
        alert('Utilisateur supprimé avec succès');
      }
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
      closeConfirmModal();
    }
  };

  // Gérer l'action confirmée
  const handleConfirmAction = () => {
    if (!selectedUser) return;
    
    switch (confirmAction) {
      case 'validate':
        handleValidateUser(selectedUser);
        break;
      case 'reject':
        handleRejectUser(selectedUser, rejectReason);
        break;
      case 'suspend':
        handleSuspendUser(selectedUser, rejectReason);
        break;
      case 'activate':
        handleActivateUser(selectedUser);
        break;
      case 'delete':
        handleDeleteUser(selectedUser);
        break;
      default:
        closeConfirmModal();
    }
  };

  // Obtenir les initiales
  const getInitials = (user) => {
    const first = user.first_name ? user.first_name.charAt(0) : '';
    const last = user.last_name ? user.last_name.charAt(0) : '';
    return first && last ? `${first}${last}`.toUpperCase() : (first || user.email?.charAt(0) || 'U').toUpperCase();
  };

  // Obtenir le nom complet
  const getFullName = (user) => {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  };

  // Obtenir la date formatée
  const getFormattedDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Vérifier si l'utilisateur a besoin de validation
  const needsValidation = (user) => {
    return user.status === 'pending' || (!user.is_validated && user.status !== 'rejected');
  };

  // Vérifier si l'utilisateur est suspendu
  const isSuspended = (user) => {
    return user.status === 'suspended';
  };

  // Vérifier si l'utilisateur est actif
  const isActive = (user) => {
    return user.is_active && user.is_validated && user.status !== 'suspended' && user.status !== 'rejected';
  };

  // Obtenir les boutons d'action selon le statut de l'utilisateur
  const ActionButtons = ({ user }) => {
    const isLoading = actionLoading === user.id;
    const isAdminUser = user.role === 'admin';
    
    if (isAdminUser) {
      return (
        <div className="action-btns">
          <button 
            className="a-btn edit" 
            title="Modifier" 
            onClick={() => openEditModal(user)}
            disabled={isLoading}
          >
            <FaEdit />
          </button>
          <button 
            className="a-btn del" 
            title="Supprimer" 
            disabled={isLoading} 
            onClick={() => openConfirmModal('delete', user)}
          >
            <FaTrash />
          </button>
        </div>
      );
    }

    return (
      <div className="action-btns">
        {needsValidation(user) && (
          <>
            <button 
              className="a-btn success" 
              title="Valider" 
              onClick={() => openConfirmModal('validate', user)}
              disabled={isLoading}
            >
              <MdCheckCircle />
            </button>
            <button 
              className="a-btn reject" 
              title="Rejeter" 
              onClick={() => openConfirmModal('reject', user)}
              disabled={isLoading}
            >
              <MdCancel />
            </button>
          </>
        )}
        
        {isActive(user) && !needsValidation(user) && (
          <button 
            className="a-btn warn" 
            title="Suspendre" 
            onClick={() => openConfirmModal('suspend', user)}
            disabled={isLoading}
          >
            <MdBlock />
          </button>
        )}
        
        {isSuspended(user) && (
          <button 
            className="a-btn success" 
            title="Activer" 
            onClick={() => openConfirmModal('activate', user)}
            disabled={isLoading}
          >
            <MdPlayCircle />
          </button>
        )}
        
        <button 
          className="a-btn edit" 
          title="Modifier" 
          onClick={() => openEditModal(user)}
          disabled={isLoading}
        >
          <FaEdit />
        </button>
        
        <button 
          className="a-btn del" 
          title="Supprimer" 
          onClick={() => openConfirmModal('delete', user)}
          disabled={isLoading}
        >
          <FaTrash />
        </button>
      </div>
    );
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilterRole("");
    setFilterStatus("");
  };

  if (loading && users.length === 0) {
    return <div className="loading-spinner">Chargement des utilisateurs...</div>;
  }

  return (
    <>
      <div className="table-card">
        <div className="table-top">
          <span className="card-title" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px" }}>
            Utilisateurs <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: "400" }}>{users.length} comptes</span>
          </span>
          <div className="table-actions">
            <select 
              className="btn-sm" 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="developpeur">Développeur</option>
              <option value="graphiste">Graphiste</option>
            </select>
            <select 
              className="btn-sm" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendu</option>
              <option value="rejected">Rejeté</option>
            </select>
            {(filterRole || filterStatus) && (
              <button className="btn-sm" onClick={resetFilters}>Réinitialiser</button>
            )}
            <button className="btn-sm">Exporter</button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="u-avatar" style={getAvatarStyle(user.role)}>
                          {getInitials(user)}
                        </div>
                        <div>
                          <div className="u-name">{getFullName(user)}</div>
                          <div className="u-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getRoleClass(user.role)}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusClass(user.status, user.is_active, user.is_validated)}>
                        {getStatusText(user.status, user.is_active, user.is_validated)}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {getFormattedDate(user.created_at)}
                    </td>
                    <td>
                      <ActionButtons user={user} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'édition */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier l'utilisateur</h3>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="field-label">Prénom</label>
                  <input
                    type="text"
                    name="first_name"
                    className="field-input"
                    value={editFormData.first_name}
                    onChange={handleEditInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="field-label">Nom</label>
                  <input
                    type="text"
                    name="last_name"
                    className="field-input"
                    value={editFormData.last_name}
                    onChange={handleEditInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="field-input"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="field-label">Rôle</label>
                  <select
                    name="role"
                    className="field-input"
                    value={editFormData.role}
                    onChange={handleEditInputChange}
                  >
                    <option value="developpeur">Développeur</option>
                    <option value="graphiste">Graphiste</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="field-label">Statut</label>
                  <select
                    name="status"
                    className="field-input"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                  >
                    <option value="pending">En attente</option>
                    <option value="active">Actif</option>
                    <option value="suspended">Suspendu</option>
                    <option value="rejected">Rejeté</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={editFormData.is_active}
                      onChange={handleEditInputChange}
                    />
                    Compte actif
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_validated"
                      checked={editFormData.is_validated}
                      onChange={handleEditInputChange}
                    />
                    Compte validé
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={closeEditModal}>
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-validate"
                  disabled={actionLoading === editingUser?.id}
                >
                  {actionLoading === editingUser?.id ? 'Chargement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {confirmAction === 'validate' && 'Valider le compte'}
                {confirmAction === 'reject' && 'Rejeter le compte'}
                {confirmAction === 'suspend' && 'Suspendre le compte'}
                {confirmAction === 'activate' && 'Activer le compte'}
                {confirmAction === 'delete' && 'Supprimer le compte'}
              </h3>
              <button className="modal-close" onClick={closeConfirmModal}>×</button>
            </div>
            <div className="modal-body">
              <p>
                {confirmAction === 'validate' && `Êtes-vous sûr de vouloir valider le compte de ${selectedUser?.first_name} ${selectedUser?.last_name} ?`}
                {confirmAction === 'reject' && `Êtes-vous sûr de vouloir rejeter le compte de ${selectedUser?.first_name} ${selectedUser?.last_name} ?`}
                {confirmAction === 'suspend' && `Êtes-vous sûr de vouloir suspendre le compte de ${selectedUser?.first_name} ${selectedUser?.last_name} ?`}
                {confirmAction === 'activate' && `Êtes-vous sûr de vouloir réactiver le compte de ${selectedUser?.first_name} ${selectedUser?.last_name} ?`}
                {confirmAction === 'delete' && `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${selectedUser?.first_name} ${selectedUser?.last_name} ? Cette action est irréversible.`}
              </p>
              
              {(confirmAction === 'reject' || confirmAction === 'suspend') && (
                <div className="form-group" style={{ marginTop: "15px" }}>
                  <label className="field-label">
                    {confirmAction === 'reject' ? 'Raison du rejet' : 'Raison de la suspension'}
                  </label>
                  <textarea
                    className="field-input"
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Indiquez la raison..."
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={closeConfirmModal}>
                Annuler
              </button>
              <button 
                className={`modal-btn modal-btn-${confirmAction}`} 
                onClick={handleConfirmAction}
                disabled={actionLoading === selectedUser?.id}
              >
                {actionLoading === selectedUser?.id ? 'Chargement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersPanel;