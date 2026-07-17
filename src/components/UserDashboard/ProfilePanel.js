// src/components/UserDashboard/ProfilePanel.jsx
import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../pages/UserDashboard';
import { 
  FaUser, FaUserEdit, FaEnvelope, FaLock, FaKey, FaSave, 
  FaUndo, FaCamera, FaUserCircle, FaIdCard, FaCalendarAlt,
  FaUserTag, FaPen, FaImage, FaSpinner, FaCheckCircle,
  FaExclamationCircle, FaTimesCircle
} from 'react-icons/fa';
import { 
  MdPerson, MdEmail, MdLock, MdKey, MdSave, MdUndo,
  MdPhotoCamera, MdEdit, MdCalendarToday, MdBadge,
  MdDescription, MdSecurity
} from 'react-icons/md';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function ProfilePanel({ searchQuery }) {
  // ===== HOOKS =====
  const context = useContext(UserContext);
  
  const defaultConfig = {
    name: 'Administrateur',
    init: 'AD',
    role: 'admin',
    ava: '#3b82f6'
  };

  const config = context?.config || defaultConfig;
  const role = context?.role || 'admin';
  const setConfig = context?.setConfig || (() => {});

  // ===== ÉTATS =====
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    role: '',
    created_at: '',
    profile_image_url: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // ===== FONCTIONS UTILITAIRES =====
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric',
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Date inconnue';
    }
  };

  const resizeAndOptimizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxSize = 200;
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          const sizeInBytes = Math.ceil(optimizedBase64.length * 0.75);
          if (sizeInBytes > 50 * 1024) {
            const smallerBase64 = canvas.toDataURL('image/jpeg', 0.4);
            resolve(smallerBase64);
          } else {
            resolve(optimizedBase64);
          }
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // ===== RÉCUPÉRATION DU PROFIL =====
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error('Erreur lors du chargement du profil');
      }
      
      const data = await response.json();
      const userData = data.user || data.data || data;
      
      setProfile({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        bio: userData.bio || '',
        role: userData.role || role,
        created_at: userData.created_at || new Date().toISOString(),
        profile_image_url: userData.profile_image_url || ''
      });
      
      if (setConfig && typeof setConfig === 'function') {
        const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        setConfig(prev => ({
          ...prev,
          name: fullName || prev?.name || 'Administrateur',
          init: fullName ? `${(userData.first_name?.[0] || '')}${(userData.last_name?.[0] || '')}`.toUpperCase() : prev?.init || 'AD',
          role: userData.role || role,
          ava: userData.profile_image_url ? `url(${userData.profile_image_url})` : prev?.ava || '#3b82f6'
        }));
      }
      
    } catch (err) {
      console.error('Erreur fetch profil:', err);
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  // ===== MISE À JOUR DU PROFIL =====
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          profile_image_url: profile.profile_image_url,
          bio: profile.bio
        })
      });
      
      if (response.status === 413) {
        throw new Error('L\'image est trop volumineuse (max 50KB après optimisation)');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour');
      }
      
      const data = await response.json();
      setSuccess('Profil mis à jour avec succès !');
      
      await fetchUserProfile();
      
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Erreur update profil:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // ===== UPLOAD PHOTO DE PROFIL =====
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const optimizedImage = await resizeAndOptimizeImage(file);
      
      setProfile(prev => ({
        ...prev,
        profile_image_url: optimizedImage
      }));
      
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          profile_image_url: optimizedImage,
          bio: profile.bio
        })
      });
      
      if (response.status === 413) {
        throw new Error('L\'image est trop volumineuse après optimisation');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }
      
      if (setConfig && typeof setConfig === 'function') {
        setConfig(prev => ({
          ...prev,
          ava: `url(${optimizedImage})`
        }));
      }
      
      setSuccess('Photo de profil mise à jour !');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Erreur upload image:', err);
      setError(`Upload échoué: ${err.message}`);
      await fetchUserProfile();
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  // ===== CHANGEMENT DE MOT DE PASSE =====
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      setPasswordError('Vous devez être connecté');
      return;
    }
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    if (!passwordData.currentPassword) {
      setPasswordError('Veuillez entrer votre mot de passe actuel');
      return;
    }
    
    setChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    
    try {
      // Tentative avec la route dédiée
      let response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      });
      
      // Fallback: Si la route n'existe pas, essayer avec PUT
      if (response.status === 404) {
        console.warn('Route de changement de mot de passe non trouvée, tentative avec PUT...');
        response = await fetch(`${API_BASE_URL}/users/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            password: passwordData.newPassword,
            currentPassword: passwordData.currentPassword
          })
        });
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      }
      
      setPasswordSuccess('Mot de passe changé avec succès !');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setPasswordSuccess(null), 3000);
      
    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
      setPasswordError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====
  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ===== EFFET DE CHARGEMENT =====
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // ===== RENDU =====
  if (loading) {
    return (
      <div className="profile-wrap" style={{ maxWidth: 620 }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ color: 'var(--dim)' }}>
            <FaSpinner className="spinner" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
            Chargement du profil...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrap" style={{ maxWidth: 620 }}>
      {/* Messages de notification */}
      {error && (
        <div className="notification error" style={{ 
          marginBottom: 16, 
          padding: '12px 16px', 
          background: 'rgba(220,38,38,.15)', 
          border: '1px solid rgba(220,38,38,.3)', 
          borderRadius: 8,
          color: '#ef4444',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span><FaExclamationCircle style={{ marginRight: 8 }} /> {error}</span>
          <button 
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}
          >
            <FaTimesCircle />
          </button>
        </div>
      )}
      
      {success && (
        <div className="notification success" style={{ 
          marginBottom: 16, 
          padding: '12px 16px', 
          background: 'rgba(34,197,94,.15)', 
          border: '1px solid rgba(34,197,94,.3)', 
          borderRadius: 8,
          color: '#22c55e',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span><FaCheckCircle style={{ marginRight: 8 }} /> {success}</span>
          <button 
            onClick={() => setSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', fontSize: 16 }}
          >
            <FaTimesCircle />
          </button>
        </div>
      )}
      
      {/* Formulaire de profil */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <span className="card-title"><FaUser style={{ marginRight: 8 }} /> Mon profil</span>
        </div>
        <form onSubmit={handleUpdateProfile}>
          <div className="card-body" style={{ padding: '14px 18px' }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div 
                className="ava-large" 
                style={{ 
                  width: 76, 
                  height: 76, 
                  borderRadius: 18, 
                  background: profile.profile_image_url 
                    ? `url(${profile.profile_image_url}) center/cover` 
                    : config?.ava || '#3b82f6',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontFamily: "'Syne', sans-serif", 
                  fontSize: 24, 
                  fontWeight: 800, 
                  margin: '0 auto 14px', 
                  position: 'relative',
                  color: 'white',
                  backgroundSize: 'cover',
                  border: '2px solid rgba(255,255,255,0.1)'
                }}
              >
                {!profile.profile_image_url && (profile.first_name?.[0] || profile.last_name?.[0] || <FaUser />)}
              </div>
              <label className="btn btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                <FaCamera style={{ marginRight: 6 }} /> Changer la photo
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleProfileImageUpload}
                  style={{ display: 'none' }}
                  disabled={saving}
                />
              </label>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 8 }}>
                Format JPG/PNG • Max 200x200px
              </div>
            </div>
            
            <div className="pform" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label className="form-label"><FaUser style={{ marginRight: 4 }} /> Prénom</label>
                <input 
                  className="form-input" 
                  value={profile.first_name}
                  onChange={(e) => handleProfileChange('first_name', e.target.value)}
                  disabled={saving}
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="form-label"><FaUser style={{ marginRight: 4 }} /> Nom</label>
                <input 
                  className="form-input" 
                  value={profile.last_name}
                  onChange={(e) => handleProfileChange('last_name', e.target.value)}
                  disabled={saving}
                  placeholder="Votre nom"
                />
              </div>
              <div className="pform-full" style={{ gridColumn: '1/-1' }}>
                <label className="form-label"><FaEnvelope style={{ marginRight: 4 }} /> Email</label>
                <input 
                  className="form-input" 
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  disabled={saving}
                  required
                  placeholder="votre@email.com"
                />
              </div>
              <div className="pform-full" style={{ gridColumn: '1/-1' }}>
                <label className="form-label"><FaPen style={{ marginRight: 4 }} /> Bio</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  style={{ resize: 'vertical', minHeight: '60px' }}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  disabled={saving}
                  placeholder="Parlez-nous de vous..."
                />
              </div>
              <div>
                <label className="form-label"><FaUserTag style={{ marginRight: 4 }} /> Rôle</label>
                <input 
                  className="form-input" 
                  value={profile.role === 'developpeur' ? 'Développeur' : 
                         profile.role === 'graphiste' ? 'Graphiste' : 
                         profile.role === 'admin' ? 'Administrateur' : 
                         profile.role || 'Utilisateur'}
                  readOnly 
                  style={{ opacity: 0.7, cursor: 'not-allowed' }} 
                />
              </div>
              <div>
                <label className="form-label"><FaCalendarAlt style={{ marginRight: 4 }} /> Membre depuis</label>
                <input 
                  className="form-input" 
                  value={formatDate(profile.created_at)}
                  readOnly 
                  style={{ opacity: 0.7, cursor: 'not-allowed' }} 
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button 
                type="button" 
                className="btn" 
                onClick={fetchUserProfile} 
                disabled={saving}
              >
                <FaUndo style={{ marginRight: 6 }} /> Annuler
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={saving}
              >
                {saving ? <><FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} /> Enregistrement...</> : <><FaSave style={{ marginRight: 6 }} /> Sauvegarder</>}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Formulaire de changement de mot de passe */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><FaLock style={{ marginRight: 8 }} /> Sécurité</span>
        </div>
        <form onSubmit={handleChangePassword}>
          <div className="card-body" style={{ padding: '14px 18px' }}>
            {passwordError && (
              <div style={{ 
                marginBottom: 12, 
                padding: '8px 12px', 
                background: 'rgba(220,38,38,.15)', 
                borderRadius: 6,
                color: '#ef4444',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span><FaExclamationCircle style={{ marginRight: 8 }} /> {passwordError}</span>
                <button 
                  onClick={() => setPasswordError(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}
                >
                  <FaTimesCircle />
                </button>
              </div>
            )}
            
            {passwordSuccess && (
              <div style={{ 
                marginBottom: 12, 
                padding: '8px 12px', 
                background: 'rgba(34,197,94,.15)', 
                borderRadius: 6,
                color: '#22c55e',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span><FaCheckCircle style={{ marginRight: 8 }} /> {passwordSuccess}</span>
                <button 
                  onClick={() => setPasswordSuccess(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', fontSize: 16 }}
                >
                  <FaTimesCircle />
                </button>
              </div>
            )}
            
            <div className="pform" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              <div>
                <label className="form-label"><FaKey style={{ marginRight: 4 }} /> Mot de passe actuel</label>
                <input 
                  className="form-input" 
                  type="password" 
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  required
                  disabled={changingPassword}
                  placeholder="Entrez votre mot de passe actuel"
                />
              </div>
              <div>
                <label className="form-label"><FaLock style={{ marginRight: 4 }} /> Nouveau mot de passe</label>
                <input 
                  className="form-input" 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  required
                  disabled={changingPassword}
                  placeholder="Au moins 6 caractères"
                />
              </div>
              <div>
                <label className="form-label"><FaCheckCircle style={{ marginRight: 4 }} /> Confirmer</label>
                <input 
                  className="form-input" 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  required
                  disabled={changingPassword}
                  placeholder="Confirmez le nouveau mot de passe"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={changingPassword}
              >
                {changingPassword ? <><FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} /> Changement...</> : <><FaKey style={{ marginRight: 6 }} /> Mettre à jour</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Style pour l'animation de rotation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
        }
      `}</style>
    </div>
  );
}