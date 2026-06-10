// services/statService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const statService = {
  // Récupérer les stats du dashboard admin
  async getAdminStats(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      throw error;
    }
  },

  // Récupérer les activités récentes
  async getRecentActivities(token, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/activities/recent?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur récupération activités:', error);
      return { success: false, activities: [] };
    }
  },

  // Récupérer les uploads par mois
  async getMonthlyUploads(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats/uploads-per-month`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur récupération uploads mensuels:', error);
      return { success: false, data: [] };
    }
  }
};