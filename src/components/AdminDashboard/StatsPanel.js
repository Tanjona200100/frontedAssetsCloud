// components/AdminDashboard/StatsPanel.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

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

const StatsPanel = () => {
  const [stats, setStats] = useState({
    assetsThisMonth: 0,
    uploadsThisMonth: 0,
    deletesThisMonth: 0,
    monthlyGrowth: 0,
    uploadGrowth: 0,
    deleteChange: 0,
    hourlyActivity: [],
    loading: true
  });

  const isMounted = useRef(true);

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Récupérer les stats générales
      const statsData = await apiRequest('/admin/stats');
      
      // Récupérer les activités horaires (aujourd'hui)
      const hourlyData = await apiRequest('/admin/stats/hourly-activity');
      
        // Calculer les stats du mois en cours
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Simuler les données de croissance (à adapter selon votre logique métier)
        const previousMonthAssets = Math.max(0, (statsData.data.totals.assets.total || 0) - 150);
        const monthlyGrowth = previousMonthAssets > 0 
          ? Math.round(((statsData.data.totals.assets.total - previousMonthAssets) / previousMonthAssets) * 100)
          : 19;
        
        const previousMonthUploads = Math.max(0, (statsData.data.totals.assets.total || 0) - 200);
        const uploadGrowth = previousMonthUploads > 0
          ? Math.round(((statsData.data.totals.assets.total - previousMonthUploads) / previousMonthUploads) * 100)
          : 34;
        
        setStats({
          assetsThisMonth: statsData.data.totals.assets.total || 0,
          uploadsThisMonth: statsData.data.totals.assets.total || 0,
          deletesThisMonth: 0, // À implémenter si vous avez une table de logs
          monthlyGrowth: monthlyGrowth,
          uploadGrowth: uploadGrowth,
          deleteChange: -2,
          hourlyActivity: hourlyData.data || [],
          loading: false
        });
    } catch (error) {
      console.error("Erreur chargement stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    
    return () => {
      clearInterval(interval);
      isMounted.current = false;
    };
  }, [fetchStats]);

  // Heures pour l'affichage
  const hours = ["0h", "2h", "4h", "6h", "8h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"];
  
  // Calculer les hauteurs des barres en fonction des données réelles
  const getBarHeights = () => {
    if (stats.hourlyActivity.length === 0) {
      // Données par défaut si aucune activité
      return [20, 12, 8, 15, 42, 78, 95, 88, 72, 55, 35, 22];
    }
    
    // Trouver la valeur maximale pour normaliser (max hauteur = 95%)
    const maxCount = Math.max(...stats.hourlyActivity.map(h => h.count), 1);
    return stats.hourlyActivity.map(h => Math.max(5, (h.count / maxCount) * 95));
  };
  
  const barHeights = getBarHeights();
  const barColors = barHeights.map(h => h >= 40 ? "green-bar" : "blue-bar");

  // Formater les nombres
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toLocaleString();
  };

  if (stats.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--text-muted)' }}>Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
              </svg>
            </div>
            <span className={`stat-delta ${stats.monthlyGrowth >= 0 ? 'up' : 'dn'}`}>
              {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%
            </span>
          </div>
          <div className="stat-val">{formatNumber(stats.assetsThisMonth)}</div>
          <div className="stat-label">Assets de ce mois</div>
        </div>
        
        <div className="stat-card green">
          <div className="stat-top">
            <div className="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className={`stat-delta ${stats.uploadGrowth >= 0 ? 'up' : 'dn'}`}>
              {stats.uploadGrowth >= 0 ? '+' : ''}{stats.uploadGrowth}%
            </span>
          </div>
          <div className="stat-val">{formatNumber(stats.uploadsThisMonth)}</div>
          <div className="stat-label">Uploads ce mois</div>
        </div>
        
        <div className="stat-card amber">
          <div className="stat-top">
            <div className="stat-icon amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <span className={`stat-delta ${stats.deleteChange >= 0 ? 'up' : 'dn'}`}>
              {stats.deleteChange >= 0 ? '+' : ''}{stats.deleteChange}%
            </span>
          </div>
          <div className="stat-val">{formatNumber(stats.deletesThisMonth)}</div>
          <div className="stat-label">Suppressions ce mois</div>
        </div>
      </div>
      
      <div className="chart-card">
        <div className="card-header">
          <span className="card-title">Activité par heure (aujourd'hui)</span>
          {stats.hourlyActivity.length > 0 && (
            <span className="card-hint">Total: {stats.hourlyActivity.reduce((sum, h) => sum + h.count, 0)} actions</span>
          )}
        </div>
        <div className="chart-area">
          <div className="bar-chart">
            {hours.map((hour, i) => (
              <div key={hour} className="bar-wrap">
                <div 
                  className={`bar ${barColors[i]}`} 
                  style={{ height: `${barHeights[i]}%` }}
                >
                  {stats.hourlyActivity[i]?.count > 0 && (
                    <span className="bar-value">{stats.hourlyActivity[i].count}</span>
                  )}
                </div>
                <span className="bar-label">{hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default StatsPanel;