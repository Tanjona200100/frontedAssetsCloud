// components/AdminDashboard/UsersPanel.jsx
import { useState, useEffect } from "react";
import { MdCheckCircle, MdCancel, MdBlock, MdPlayCircle } from "react-icons/md";
import { FaTrash, FaEdit } from "react-icons/fa";

const API_BASE_URL = process.env.REACT_APP_API_URL;

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

  // États pour les popups de notification
  const [notification, setNotification] = useState({
    show: false,
    type: '', // 'success', 'error', 'warning', 'info'
    title: '',
    message: '',
    duration: 4000
  });

  // Fonction pour afficher une notification
  const showNotification = (type, title, message, duration = 4000) => {
    setNotification({
      show: true,
      type,
      title,
      message,
      duration
    });
  };

  // Fonction pour fermer la notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Auto-fermeture de la notification
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        closeNotification();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.show, notification.duration]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/users/admin/users');
      
      let filteredUsers = [];
      if (data.users) {
        filteredUsers = data.users;
      } else if (data.data) {
        filteredUsers = data.data;
      } else if (Array.isArray(data)) {
        filteredUsers = data;
      }
      
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

  const openConfirmModal = (action, user) => {
    setSelectedUser(user);
    setConfirmAction(action);
    setRejectReason("");
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setSelectedUser(null);
    setRejectReason("");
  };

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

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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
        showNotification(
          'success',
          '✅ Mise à jour réussie',
          `L'utilisateur ${editingUser.first_name} ${editingUser.last_name} a été mis à jour avec succès.`
        );
      } else {
        throw new Error(data.error || 'Échec de la mise à jour');
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      showNotification(
        'error',
        '❌ Erreur de mise à jour',
        err.message || "Impossible de mettre à jour l'utilisateur. Veuillez réessayer."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidateUser = async (user, sendEmail = true) => {
    setActionLoading(user.id);
    try {
      const data = await apiRequest(`/admin/users/${user.id}/validate`, {
        method: 'POST',
        body: JSON.stringify({ sendEmail })
      });
      if (data.success) {
        await fetchUsers();
        closeConfirmModal();
        showNotification(
          'success',
          '✅ Validation réussie',
          `Le compte de ${user.first_name} ${user.last_name} a été validé avec succès.`
        );
      } else {
        throw new Error(data.error || 'Échec de la validation');
      }
    } catch (err) {
      console.error("Erreur lors de la validation:", err);
      showNotification(
        'error',
        '❌ Erreur de validation',
        err.message || "Impossible de valider le compte. Veuillez réessayer."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (user, reason) => {
    if (!reason) {
      showNotification(
        'warning',
        '⚠️ Raison requise',
        'Veuillez indiquer une raison pour le rejet du compte.'
      );
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
        closeConfirmModal();
        showNotification(
          'success',
          '✅ Rejet effectué',
          `Le compte de ${user.first_name} ${user.last_name} a été rejeté. Une notification a été envoyée.`
        );
      } else {
        throw new Error(data.error || 'Échec du rejet');
      }
    } catch (err) {
      console.error("Erreur lors du rejet:", err);
      showNotification(
        'error',
        '❌ Erreur de rejet',
        err.message || "Impossible de rejeter le compte. Veuillez réessayer."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (user, reason) => {
    if (!reason) {
      showNotification(
        'warning',
        '⚠️ Raison requise',
        'Veuillez indiquer une raison pour la suspension du compte.'
      );
      return;
    }

    setActionLoading(user.id);
    try {
      const data = await apiRequest(`/admin/users/${user.id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      if (data.success) {
        await fetchUsers();
        closeConfirmModal();
        showNotification(
          'success',
          '✅ Suspension réussie',
          `Le compte de ${user.first_name} ${user.last_name} a été suspendu.`
        );
      } else {
        throw new Error(data.error || 'Échec de la suspension');
      }
    } catch (err) {
      console.error("Erreur lors de la suspension:", err);
      showNotification(
        'error',
        '❌ Erreur de suspension',
        err.message || "Impossible de suspendre le compte. Veuillez réessayer."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async (user) => {
    setActionLoading(user.id);
    try {
      const data = await apiRequest(`/admin/users/${user.id}/activate`, {
        method: 'POST'
      });
      if (data.success) {
        await fetchUsers();
        closeConfirmModal();
        showNotification(
          'success',
          '✅ Activation réussie',
          `Le compte de ${user.first_name} ${user.last_name} a été réactivé avec succès.`
        );
      } else {
        throw new Error(data.error || 'Échec de l\'activation');
      }
    } catch (err) {
      console.error("Erreur lors de l'activation:", err);
      showNotification(
        'error',
        '❌ Erreur d\'activation',
        err.message || "Impossible d'activer le compte. Veuillez réessayer."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user) => {
    setActionLoading(user.id);
    try {
      const data = await apiRequest(`/users/admin/users/${user.id}`, {
        method: 'DELETE'
      });
      if (data.success) {
        await fetchUsers();
        closeConfirmModal();
        showNotification(
          'success',
          '✅ Suppression réussie',
          `Le compte de ${user.first_name} ${user.last_name} a été supprimé définitivement.`
        );
      } else {
        throw new Error(data.error || 'Échec de la suppression');
      }
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      showNotification(
        'error',
        '❌ Erreur de suppression',
        err.message || "Impossible de supprimer le compte. Veuillez réessayer."
      );
    } finally {
      setActionLoading(null);
    }
  };

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

  const getInitials = (user) => {
    const first = user.first_name ? user.first_name.charAt(0) : '';
    const last = user.last_name ? user.last_name.charAt(0) : '';
    return first && last ? `${first}${last}`.toUpperCase() : (first || user.email?.charAt(0) || 'U').toUpperCase();
  };

  const getFullName = (user) => {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  };

  const getFormattedDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const needsValidation = (user) => {
    return user.status === 'pending' || (!user.is_validated && user.status !== 'rejected');
  };

  const isSuspended = (user) => {
    return user.status === 'suspended';
  };

  const isActive = (user) => {
    return user.is_active && user.is_validated && user.status !== 'suspended' && user.status !== 'rejected';
  };

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

  const resetFilters = () => {
    setFilterRole("");
    setFilterStatus("");
  };

  // Rendu du composant de notification - Version grand centre
  const NotificationPopup = () => {
    if (!notification.show) return null;

    const getIcon = () => {
      switch (notification.type) {
        case 'success':
          return <MdCheckCircle className="notification-icon success" />;
        case 'error':
          return <MdCancel className="notification-icon error" />;
        case 'warning':
          return <MdBlock className="notification-icon warning" />;
        default:
          return null;
      }
    };

    const getClassName = () => {
      return `notification-popup-center ${notification.type}`;
    };

    return (
      <div className="notification-overlay-center" onClick={closeNotification}>
        <div className={getClassName()} onClick={(e) => e.stopPropagation()}>
          <div className="notification-content-center">
            <div className="notification-icon-wrapper">
              {getIcon()}
            </div>
            <h3 className="notification-title-center">{notification.title}</h3>
            <p className="notification-message-center">{notification.message}</p>
            <button className="notification-close-center" onClick={closeNotification}>
              ×
            </button>
            <div className="notification-progress-center" style={{ animationDuration: `${notification.duration}ms` }} />
          </div>
        </div>
      </div>
    );
  };

  if (loading && users.length === 0) {
    return <div className="loading-spinner">Chargement des utilisateurs...</div>;
  }

  return (
    <>
      <NotificationPopup />
      
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