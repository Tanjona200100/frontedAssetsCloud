// components/AdminDashboard/AssetsPanel/hooks.js

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiRequest } from './api';
import { API_BASE_URL } from './constants';

export const useFetchAssets = (filters, limit, page) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const isMounted = useRef(true);

  const fetchAssets = useCallback(async (pageNum = page) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

     // components/AdminDashboard/AssetsPanel/hooks.js

const buildQueryParams = (extra = {}) => {
  const params = new URLSearchParams();
  params.set('page', pageNum);
  params.set('limit', limit);

  if (filters.search) params.set('search', filters.search);
  if (filters.visibility) params.set('visibility', filters.visibility);
  if (filters.file_type) params.set('file_type', filters.file_type);
  // ✅ CORRECTION : Utiliser le bon nom de paramètre
  if (filters.created_by) params.set('user_id', filters.created_by); // ou 'created_by_id' ou 'creator_id'
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);

  Object.entries(extra).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return params.toString();
};

      let url;
      if (filters.category && filters.project) {
        url = `/assets?${buildQueryParams({ category_id: filters.category, project_id: filters.project })}`;
      } else if (filters.category) {
        url = `/categories/${filters.category}/assets?${buildQueryParams()}`;
      } else if (filters.project) {
        url = `/projects/${filters.project}/assets?${buildQueryParams()}`;
      } else {
        url = `/assets?${buildQueryParams()}`;
      }

      const data = await apiRequest(url);

      const assetsList = data.assets || data.data || [];
      const pagination = data.pagination || {};
      
      setAssets(assetsList);
      setTotalPages(pagination.totalPages || data.totalPages || Math.ceil((pagination.total || data.total || 0) / limit) || 1);
      setTotalAssets(pagination.total || data.total || 0);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur chargement assets:', err);
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, limit, page]);

  useEffect(() => {
    fetchAssets(page);
  }, [page, fetchAssets]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return { assets, loading, error, totalPages, totalAssets, fetchAssets, setAssets };
};

export const useFetchMetadata = () => {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/simple`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erreur chargement projets');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Erreur fetchProjects:', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erreur chargement catégories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Erreur fetchCategories:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      let usersData = [];
      try {
        const response = await fetch(`${API_BASE_URL}/users/admin/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          usersData = data.users || data.data || data;
        }
      } catch (e) {
      }

      if (usersData.length === 0) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/admin/users`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            usersData = data.users || data.data || data;
          }
        } catch (e) {
        }
      }

      setUsers(usersData);
    } catch (err) {
      console.error('Erreur fetchUsers:', err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchCategories();
    fetchUsers();
  }, []);

  return { projects, categories, users, fetchProjects, fetchCategories, fetchUsers };
};