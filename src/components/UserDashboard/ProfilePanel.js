// src/components/UserDashboard/ProfilePanel.jsx
import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../pages/UserDashboard';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

export default function ProfilePanel() {
  const { config, role, setConfig } = useContext(UserContext);
  const isGfx = role === 'gfx';
  
  // États pour le profil
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
  
  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  
  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };
  
  // Redimensionner et optimiser l'image
  const resizeAndOptimizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          // Créer un canvas pour redimensionner
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Limiter la taille maximale à 200x200 pixels
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
          
          // Convertir en JPEG avec qualité réduite
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          // Vérifier la taille (max 50KB après optimisation)
          const sizeInBytes = Math.ceil(optimizedBase64.length * 0.75); // Approximation base64 -> bytes
          if (sizeInBytes > 50 * 1024) {
            // Si encore trop grand, réduire davantage la qualité
            const smallerBase64 = canvas.toDataURL('image/jpeg', 0.5);
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
  
  // Récupérer le profil utilisateur
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
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
      
      // Mettre à jour le contexte si nécessaire
      if (setConfig) {
        setConfig(prev => ({
          ...prev,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          init: `${(userData.first_name?.[0] || '')}${(userData.last_name?.[0] || '')}`.toUpperCase(),
          role: userData.role || role,
          ava: userData.profile_image_url ? `url(${userData.profile_image_url})` : prev.ava
        }));
      }
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Mettre à jour le profil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
      
      // Recharger le profil
      await fetchUserProfile();
      
      // Effacer le message après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Upload de photo de profil avec optimisation
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Redimensionner et optimiser l'image
      const optimizedImage = await resizeAndOptimizeImage(file);
      
      // Mettre à jour localement d'abord
      setProfile(prev => ({
        ...prev,
        profile_image_url: optimizedImage
      }));
      
      // Sauvegarder via PUT /users/me
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
        throw new Error('L\'image est trop volumineuse après optimisation. Veuillez choisir une image plus petite.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }
      
      // Mettre à jour le contexte
      if (setConfig) {
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
      // Recharger le profil pour annuler les changements locaux
      await fetchUserProfile();
    } finally {
      setSaving(false);
      // Reset file input
      e.target.value = '';
    }
  };
  
  // Changer le mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
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
      const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du changement de mot de passe');
      }
      
      setPasswordSuccess('Mot de passe changé avec succès !');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Effacer le message après 3 secondes
      setTimeout(() => setPasswordSuccess(null), 3000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };
  
  // Gérer les changements des champs du profil
  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Gérer les changements des champs de mot de passe
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Chargement initial
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  if (loading) {
    return (
      <div className="profile-wrap" style={{ maxWidth: 620 }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ color: 'var(--dim)' }}>Chargement du profil...</div>
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
          fontSize: 13
        }}>
          ⚠️ {error}
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
          fontSize: 13
        }}>
          ✓ {success}
        </div>
      )}
      
      {/* Formulaire de profil */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <span className="card-title">Mon profil</span>
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
                  background: profile.profile_image_url ? `url(${profile.profile_image_url}) center/cover` : (config.ava || '#3b82f6'),
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontFamily: "'Syne', sans-serif", 
                  fontSize: 24, 
                  fontWeight: 800, 
                  margin: '0 auto 14px', 
                  position: 'relative',
                  color: 'white',
                  backgroundSize: 'cover'
                }}
              >
                {!profile.profile_image_url && (profile.first_name?.[0] || profile.last_name?.[0] || 'U')}
              </div>
              <label className="btn btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                Changer la photo
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
                <label className="form-label">Prénom</label>
                <input 
                  className="form-input" 
                  value={profile.first_name}
                  onChange={(e) => handleProfileChange('first_name', e.target.value)}
                  disabled={saving}
                />
              </div>
              <div>
                <label className="form-label">Nom</label>
                <input 
                  className="form-input" 
                  value={profile.last_name}
                  onChange={(e) => handleProfileChange('last_name', e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="pform-full" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Email</label>
                <input 
                  className="form-input" 
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  disabled={saving}
                  required
                />
              </div>
              <div className="pform-full" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Bio</label>
                <textarea 
                  className="form-input" 
                  rows="2" 
                  style={{ resize: 'none' }}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  disabled={saving}
                  placeholder="Parlez-nous de vous..."
                />
              </div>
              <div>
                <label className="form-label">Rôle</label>
                <input 
                  className="form-input" 
                  defaultValue={profile.role === 'developpeur' ? 'Développeur' : profile.role === 'graphiste' ? 'Graphiste' : 'Admin'}
                  readOnly 
                  style={{ opacity: 0.6 }} 
                />
              </div>
              <div>
                <label className="form-label">Membre depuis</label>
                <input 
                  className="form-input" 
                  defaultValue={formatDate(profile.created_at)}
                  readOnly 
                  style={{ opacity: 0.6 }} 
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={fetchUserProfile} disabled={saving}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Formulaire de changement de mot de passe */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Sécurité</span>
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
                fontSize: 12
              }}>
                ⚠️ {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div style={{ 
                marginBottom: 12, 
                padding: '8px 12px', 
                background: 'rgba(34,197,94,.15)', 
                borderRadius: 6,
                color: '#22c55e',
                fontSize: 12
              }}>
                ✓ {passwordSuccess}
              </div>
            )}
            
            <div className="pform" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              <div>
                <label className="form-label">Mot de passe actuel</label>
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
                <label className="form-label">Nouveau mot de passe</label>
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
                <label className="form-label">Confirmer</label>
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
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                {changingPassword ? 'Changement...' : 'Mettre à jour'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}