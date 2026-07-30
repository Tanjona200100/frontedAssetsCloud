// src/auth/reset-password/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validToken, setValidToken] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: '#E2E8F0',
  });

  const { logout } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  // Vérifier le token au chargement
  useEffect(() => {
    if (!token) {
      setValidToken(false);
      setError('Token de réinitialisation manquant');
    }
  }, [token]);

  // Fonction pour évaluer la force du mot de passe
  const evaluatePasswordStrength = (password) => {
    let score = 0;
    let message = '';
    let color = '#E2E8F0';

    if (password.length === 0) {
      return { score: 0, message: '', color: '#E2E8F0' };
    }

    // Longueur
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Complexité
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Message et couleur
    if (score <= 2) {
      message = 'Faible';
      color = '#EF4444';
    } else if (score <= 4) {
      message = 'Moyen';
      color = '#F59E0B';
    } else {
      message = 'Fort';
      color = '#10B981';
    }

    return { score, message, color };
  };

  // Gérer les changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'newPassword') {
      setPasswordStrength(evaluatePasswordStrength(value));
    }

    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError('');
  };

  // Gérer la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Déconnecter l'utilisateur s'il est connecté
        await logout();
        
        // Rediriger vers login après 3 secondes
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Mot de passe réinitialisé avec succès ! Veuillez vous connecter.' 
            }
          });
        }, 3000);
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation du mot de passe');
        if (data.error?.toLowerCase().includes('token') || data.error?.toLowerCase().includes('invalide')) {
          setValidToken(false);
        }
      }
    } catch (error) {
      console.error('❌ Reset password error:', error);
      setError('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Si token invalide
  if (!validToken) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card error-card">
          <div className="reset-password-header">
            <h2>Lien invalide</h2>
            <p>Ce lien de réinitialisation est invalide ou a expiré.</p>
          </div>
          <div className="reset-password-body">
            <div className="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p className="error-message">{error}</p>
            <p className="help-text">
              Veuillez demander un nouveau lien de réinitialisation depuis la page de connexion.
            </p>
            <Link to="/login" className="btn-primary">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si succès
  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card success-card">
          <div className="reset-password-header">
            <h2>Mot de passe réinitialisé !</h2>
            <p>Votre mot de passe a été modifié avec succès.</p>
          </div>
          <div className="reset-password-body">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p className="success-message">
              Vous allez être redirigé vers la page de connexion...
            </p>
            <div className="loading-spinner"></div>
            <Link to="/login" className="btn-primary">
              Se connecter maintenant
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h2>Nouveau mot de passe</h2>
          <p>Veuillez choisir un nouveau mot de passe sécurisé</p>
        </div>

        <form className="reset-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">
              Nouveau mot de passe
              <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Entrez votre nouveau mot de passe"
                className={error ? 'input-error' : ''}
                required
                minLength="8"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {formData.newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength.score / 6) * 100}%`,
                      backgroundColor: passwordStrength.color 
                    }}
                  ></div>
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  {passwordStrength.message}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirmer le mot de passe
              <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmez votre nouveau mot de passe"
                className={error ? 'input-error' : ''}
                required
                disabled={loading}
              />
            </div>
          </div>

          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <div className="password-match-error">
              <span className="error-icon-small">⚠️</span>
              Les mots de passe ne correspondent pas
            </div>
          )}

          {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
            <div className="password-match-success">
              <span className="success-icon-small">✓</span>
              Les mots de passe correspondent
            </div>
          )}

          {error && (
            <div className="form-error">
              <span className="error-icon-small">⚠️</span>
              {error}
            </div>
          )}

          <div className="password-requirements">
            <h4>Votre mot de passe doit contenir :</h4>
            <ul>
              <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
                {formData.newPassword.length >= 8 ? '✓' : '•'} Au moins 8 caractères
              </li>
              <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
                {/[a-z]/.test(formData.newPassword) ? '✓' : '•'} Une lettre minuscule
              </li>
              <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
                {/[A-Z]/.test(formData.newPassword) ? '✓' : '•'} Une lettre majuscule
              </li>
              <li className={/[0-9]/.test(formData.newPassword) ? 'valid' : ''}>
                {/[0-9]/.test(formData.newPassword) ? '✓' : '•'} Un chiffre
              </li>
              <li className={/[^a-zA-Z0-9]/.test(formData.newPassword) ? 'valid' : ''}>
                {/[^a-zA-Z0-9]/.test(formData.newPassword) ? '✓' : '•'} Un caractère spécial
              </li>
            </ul>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Réinitialisation en cours...
              </>
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </button>

          <div className="reset-password-footer">
            <Link to="/login" className="back-link">
              ← Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;