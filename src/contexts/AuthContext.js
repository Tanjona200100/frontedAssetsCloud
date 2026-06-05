import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://192.168.2.160:5000/api';

  // Fonction pour récupérer le profil utilisateur
  const fetchProfile = useCallback(async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        setLoading(false);
        return null;
      }

      console.log('🔍 Fetching profile from:', `${API_BASE_URL}/auth/profile`);
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      } else {
        console.warn('⚠️ Profile fetch failed:', data);
        if (response.status === 401) {
          await logout();
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Charger le profil au montage
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  // Fonction de connexion
// contexts/AuthContext.js (extrait modifié)
const login = async (email, password) => {
  try {
    console.log('🔐 Tentative de connexion...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      const { token, user, expiresAt } = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('expiresAt', expiresAt);
      setToken(token);
      setUser(user);
      console.log('✅ Connexion réussie pour:', user.email, 'Rôle:', user.role);
      return { success: true, user }; // Retourner l'utilisateur aussi
    }
    
    console.warn('⚠️ Échec de connexion:', data.error);
    return { 
      success: false, 
      error: data.error || 'Email ou mot de passe incorrect' 
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    return { 
      success: false, 
      error: 'Erreur de connexion au serveur. Vérifiez que le backend est démarré.' 
    };
  }
};
  // Fonction de déconnexion
  const logout = useCallback(async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Fonction d'inscription - CORRIGÉE pour accepter FormData ou JSON
  const register = async (userData) => {
    try {
      console.log("📤 Envoi des données:", userData);
      
      // Vérifier si c'est du FormData ou un objet JSON
      const isFormData = userData instanceof FormData;
      
      let body;
      let headers = {};
      
      if (isFormData) {
        // Pour FormData, ne pas définir Content-Type (le navigateur le fait automatiquement)
        body = userData;
        console.log("📎 Envoi en tant que FormData");
      } else {
        // Pour JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(userData);
        console.log("📦 Envoi en tant que JSON");
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      const data = await response.json();
      console.log("📥 Réponse complète du serveur:", data);
      
      // Gérer les erreurs de validation
      if (data.errors) {
        const errorMessages = data.errors.map(err => `${err.path}: ${err.msg}`).join(", ");
        return { 
          success: false, 
          error: errorMessages
        };
      }
      
      // Succès
      if (response.ok && data.success) {
        return { 
          success: true, 
          message: data.message || "Inscription réussie !",
          user: data.user
        };
      }
      
      // Autre erreur
      return { 
        success: false, 
        error: data.error || 'Erreur lors de l\'inscription' 
      };
    } catch (error) {
      console.error("❌ Erreur réseau:", error);
      return { 
        success: false, 
        error: 'Erreur de connexion au serveur. Vérifiez que le backend est démarré sur le port 5000.' 
      };
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    fetchProfile,
    loading,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};