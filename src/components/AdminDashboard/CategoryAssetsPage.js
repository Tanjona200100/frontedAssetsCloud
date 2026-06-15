// src/components/UserDashboard/CategoryAssetsPage.jsx
import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdAdd } from "react-icons/md";
import { LiaEyeSolid, LiaDownloadSolid, LiaTrashAltSolid, LiaGlobeSolid, LiaLockSolid } from 'react-icons/lia';
import { PiCubeLight } from "react-icons/pi";
import { FaRegFile } from "react-icons/fa6";
import { RiDossierFill } from "react-icons/ri";

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
    throw new Error(data.error || data.message || 'Une erreur est survenue');
  }
  
  return data;
};

const is3DModel = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  const supported3DFormats = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds'];

  return supported3DFormats.includes(ext) || fileType === '3d_model' ||
    supported3DFormats.some(format => name?.endsWith(`.${format}`));
};

const formatSize = (bytes) => {
  if (!bytes) return '0 MB';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date inconnue';
  return new Date(dateString).toLocaleDateString('fr-FR');
};

export default function CategoryAssetsPage({ categoryId, categoryData, onBack }) {
  const [category, setCategory] = useState(categoryData || null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [error, setError] = useState(null);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [hoveredAssetId, setHoveredAssetId] = useState(null);
  
  // Charger les informations de la catégorie
  const fetchCategory = async () => {
    if (categoryData) return;
    
    try {
      const data = await apiRequest(`/categories/${categoryId}`);
      const categoryData = data.category || data.data || data;
      setCategory(categoryData);
    } catch (err) {
      console.error("Erreur lors du chargement de la catégorie:", err);
      setError(err.message || "Impossible de charger la catégorie");
    }
  };
  
  // Charger les assets de la catégorie
  const fetchCategoryAssets = async () => {
    try {
      setLoadingAssets(true);
      const data = await apiRequest(`/categories/${categoryId}/assets`);
      
      let assetsList = [];
      if (Array.isArray(data)) {
        assetsList = data;
      } else if (data.assets && Array.isArray(data.assets)) {
        assetsList = data.assets;
      } else if (data.data && Array.isArray(data.data)) {
        assetsList = data.data;
      }
      
      setAssets(assetsList);
    } catch (err) {
      console.error("Erreur lors du chargement des assets:", err);
      setError(err.message || "Impossible de charger les assets");
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };
  
  // Charger tous les assets disponibles pour l'ajout
  const fetchAvailableAssets = async () => {
    try {
      setLoadingAvailable(true);
      const data = await apiRequest('/assets?limit=100');
      
      let allAssets = [];
      if (Array.isArray(data)) {
        allAssets = data;
      } else if (data.assets && Array.isArray(data.assets)) {
        allAssets = data.assets;
      } else if (data.data && Array.isArray(data.data)) {
        allAssets = data.data;
      }
      
      const categoryAssetIds = new Set(assets.map(a => a.id));
      const available = allAssets.filter(asset => !categoryAssetIds.has(asset.id));
      setAvailableAssets(available);
    } catch (err) {
      console.error("Erreur lors du chargement des assets disponibles:", err);
      setError(err.message || "Impossible de charger les assets disponibles");
    } finally {
      setLoadingAvailable(false);
    }
  };
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCategory();
      await fetchCategoryAssets();
      setLoading(false);
    };
    loadData();
  }, [categoryId]);
  
  // Ajouter un asset à la catégorie
  const handleAddAsset = async (assetId) => {
    try {
      await apiRequest(`/categories/${categoryId}/assets/${assetId}`, {
        method: 'POST'
      });
      
      await fetchCategoryAssets();
      setShowAddAssetModal(false);
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'asset:", err);
      setError(err.message || "Erreur lors de l'ajout de l'asset");
    }
  };
  
  // Retirer un asset de la catégorie
  const handleRemoveAsset = async () => {
    if (!assetToDelete) return;
    
    try {
      await apiRequest(`/categories/${categoryId}/assets/${assetToDelete.id}`, {
        method: 'DELETE'
      });
      
      await fetchCategoryAssets();
      setShowConfirmModal(false);
      setAssetToDelete(null);
    } catch (err) {
      console.error("Erreur lors du retrait de l'asset:", err);
      setError(err.message || "Erreur lors du retrait de l'asset");
    }
  };
  
  // Télécharger un asset
  const handleDownload = async (assetId, assetName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = assetName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Téléchargement échoué: ${err.message}`);
    }
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
        <div style={{ color: 'var(--dim)' }}>Chargement...</div>
      </div>
    );
  }
  
  if (!category) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ fontSize: 16, color: 'var(--dim)', marginBottom: 8 }}>Catégorie non trouvée</div>
        <button onClick={onBack} className="btn btn-primary">
          Retour aux catégories
        </button>
      </div>
    );
  }
  
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,.05)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20
          }}
        >
          <MdArrowBack size={18} />
          Retour aux catégories
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: category.bg || 'rgba(59,130,246,.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32
            }}>
              {category.icon || '📁'}
            </div>
            <div>
              <h1 style={{ fontSize: 24, marginBottom: 8, color: category.color || '#3B82F6' }}>{category.name}</h1>
              {category.description && (
                <p style={{ fontSize: 13, color: 'var(--dim)' }}>{category.description}</p>
              )}
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              fetchAvailableAssets();
              setShowAddAssetModal(true);
            }}
            style={{ background: '#3B82F6', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <MdAdd size={16} />
            Ajouter un asset
          </button>
        </div>
      </div>
      
      {error && (
        <div style={{ padding: '12px 18px', background: 'rgba(220,38,38,.15)', color: '#ef4444', fontSize: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}
      
      {/* Grille des assets */}
      <div className="tbl-wrap" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div className="tbl-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="card-title">Assets de la catégorie</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>{assets.length} fichiers</span>
          </div>
        </div>
        
        {loadingAssets ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dim)' }}>Chargement des assets...</div>
        ) : assets.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}><RiDossierFill /></div>
            <div>Aucun asset dans cette catégorie</div>
            <button 
              onClick={() => {
                fetchAvailableAssets();
                setShowAddAssetModal(true);
              }}
              style={{ marginTop: 16, background: '#3B82F6', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', color: 'white' }}
            >
              + Ajouter un asset
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
            padding: '18px'
          }}>
            {assets.map((asset) => {
              const is3D = is3DModel(asset);
              const isHovered = hoveredAssetId === asset.id;
              
              return (
                <div
                  key={asset.id}
                  style={{
                    background: 'rgba(0,0,0,.3)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: `1px solid ${isHovered ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.06)'}`,
                    transition: 'transform 0.2s, border-color 0.2s',
                    transform: isHovered ? 'translateY(-4px)' : 'none'
                  }}
                  onMouseEnter={() => setHoveredAssetId(asset.id)}
                  onMouseLeave={() => setHoveredAssetId(null)}
                >
                  {/* Zone de preview */}
                  <div
                    style={{
                      height: 200,
                      background: 'rgba(0,0,0,.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                  >
                    {is3D ? (
                      asset.capture_url ? (
                        <>
                          <img
                            src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
                            alt={`Aperçu de ${asset.title || asset.name}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.querySelector('.default-3d-preview').style.display = 'flex';
                            }}
                          />
                          <div className="default-3d-preview" style={{ display: 'none', textAlign: 'center' }}>
                            <div style={{ fontSize: 64, marginBottom: 8 }}><PiCubeLight /></div>
                            <div style={{ fontSize: 12, color: '#3b82f6' }}>Modèle 3D</div>
                          </div>
                          {isHovered && (
                            <div style={{
                              position: 'absolute',
                              bottom: 16,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'rgba(0,0,0,.8)',
                              padding: '6px 14px',
                              borderRadius: 20,
                              fontSize: 12,
                              color: '#10b981',
                              whiteSpace: 'nowrap',
                              zIndex: 2
                            }}>
                              ✨ Cliquer pour visualiser
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 64, marginBottom: 8 }}><PiCubeLight /></div>
                          <div style={{ fontSize: 12, color: '#3b82f6' }}>Modèle 3D</div>
                        </div>
                      )
                    ) : (
                      asset.capture_url ? (
                        <img
                          src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
                          alt={`Aperçu de ${asset.title || asset.name}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: 64, opacity: 0.5 }}><FaRegFile /></div>
                      )
                    )}
                  </div>
                  
                  {/* Informations */}
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: 'white' }}>
                      {asset.title || asset.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                      {formatSize(asset.file_size || asset.size)} • {formatDate(asset.created_at)}
                    </div>
                    {asset.description && (
                      <div style={{
                        fontSize: 11,
                        color: '#888',
                        marginBottom: 10,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {asset.description}
                      </div>
                    )}
                    {is3D && (
                      <div style={{ fontSize: 10, color: '#10b981', marginBottom: 10 }}>
                        <PiCubeLight /> Modèle 3D
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      borderTop: '1px solid rgba(255,255,255,.06)',
                      paddingTop: 12,
                      marginTop: 4
                    }}>
                      <button
                        style={{
                          flex: 1,
                          background: 'rgba(59,130,246,.15)',
                          border: 'none',
                          padding: '7px',
                          borderRadius: 6,
                          color: '#3B82F6',
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,.25)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59,130,246,.15)'}
                      >
                        <LiaEyeSolid size={14} />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownload(asset.id, asset.name)}
                        style={{
                          background: 'rgba(255,255,255,.05)',
                          border: 'none',
                          padding: '7px 12px',
                          borderRadius: 6,
                          color: '#888',
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                        title="Télécharger"
                      >
                        <LiaDownloadSolid size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setAssetToDelete({ id: asset.id, name: asset.title || asset.name });
                          setShowConfirmModal(true);
                        }}
                        style={{
                          background: 'rgba(220,38,38,.1)',
                          border: 'none',
                          padding: '7px 12px',
                          borderRadius: 6,
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.1)'}
                        title="Retirer de la catégorie"
                      >
                        <LiaTrashAltSolid size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modal d'ajout d'asset avec affichage des captures */}
      {showAddAssetModal && (
        <div className="modal-overlay" onClick={() => setShowAddAssetModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900, maxHeight: '85vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>Ajouter un asset à la catégorie</h3>
              <button className="modal-close" onClick={() => setShowAddAssetModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {loadingAvailable ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div className="loading-spinner">Chargement des assets disponibles...</div>
                </div>
              ) : availableAssets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                  <div style={{ fontSize: 14, color: 'var(--dim)', marginBottom: 8 }}>Aucun asset disponible</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tous les assets sont déjà dans cette catégorie</div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px'
                }}>
                  {availableAssets.map((asset) => {
                    const is3D = is3DModel(asset);
                    return (
                      <div
                        key={asset.id}
                        className="available-asset-card"
                        style={{
                          background: 'rgba(0,0,0,.3)',
                          borderRadius: 10,
                          overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,.06)',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, border-color 0.2s'
                        }}
                        onClick={() => handleAddAsset(asset.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.borderColor = 'rgba(59,130,246,.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)';
                        }}
                      >
                        {/* Zone d'aperçu avec capture si disponible */}
                        <div style={{
                          height: 160,
                          background: 'rgba(0,0,0,.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {is3D && asset.capture_url ? (
                            <img
                              src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
                              alt={`Aperçu de ${asset.title || asset.name}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.querySelector('.default-icon').style.display = 'flex';
                              }}
                            />
                          ) : is3D ? (
                            <div className="default-icon" style={{ textAlign: 'center' }}>
                              <PiCubeLight size={48} style={{ opacity: 0.6 }} />
                            </div>
                          ) : asset.file_type === 'image' && asset.capture_url ? (
                            <img
                              src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
                              alt={`Aperçu de ${asset.title || asset.name}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center'
                              }}
                            />
                          ) : (
                            <div className="default-icon" style={{ textAlign: 'center' }}>
                              <FaRegFile size={48} style={{ opacity: 0.6 }} />
                            </div>
                          )}
                          
                          {/* Badge de type */}
                          <div style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'rgba(0,0,0,.7)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 10,
                            color: '#3B82F6'
                          }}>
                            {asset.file_type === '3d_model' ? '3D' : 
                             asset.file_type === 'image' ? 'IMAGE' :
                             asset.file_type === 'video' ? 'VIDÉO' : 
                             asset.file_type?.toUpperCase() || 'FICHIER'}
                          </div>
                        </div>
                        
                        {/* Informations */}
                        <div style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, color: 'white' }}>
                            {asset.title || asset.name}
                          </div>
                          <div style={{ fontSize: 10, color: '#666', marginBottom: 6 }}>
                            {formatSize(asset.file_size)} • {formatDate(asset.created_at)}
                          </div>
                          {asset.description && (
                            <div style={{
                              fontSize: 10,
                              color: '#888',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginBottom: 8
                            }}>
                              {asset.description}
                            </div>
                          )}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: '1px solid rgba(255,255,255,.06)'
                          }}>
                            <div style={{
                              background: 'rgba(59,130,246,.15)',
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: 10,
                              color: '#3B82F6'
                            }}>
                              {asset.visibility === 'public' ? '🌍 Public' : 
                               asset.visibility === 'team' ? '👥 Team' : '🔒 Privé'}
                            </div>
                            <button
                              style={{
                                marginLeft: 'auto',
                                background: '#3B82F6',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 6,
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: 11,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <MdAdd size={12} />
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmation retrait */}
      {showConfirmModal && assetToDelete && (
        <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Confirmer le retrait</h3>
              <button className="modal-close" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>×</button>
            </div>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir retirer <strong>{assetToDelete.name}</strong> de cette catégorie ?</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => { setShowConfirmModal(false); setAssetToDelete(null); }}>Annuler</button>
              <button className="modal-btn modal-btn-delete" onClick={handleRemoveAsset} style={{ background: 'rgba(220,38,38,.1)', border: 'none', padding: '8px 16px', borderRadius: 6, color: '#ef4444', cursor: 'pointer' }}>Retirer</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-container {
          background: #0a0f1a;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          width: 90%;
          max-width: 900px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }
        
        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-muted);
        }
        
        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        
        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(255,255,255,.1);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .modal-btn {
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        
        .modal-btn-cancel {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          color: var(--text);
        }
        
        .btn-primary {
          background: #3B82F6;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .available-asset-card {
          cursor: pointer;
        }
        
        .loading-spinner {
          font-family: "'JetBrains Mono', monospace";
          font-size: 12px;
          color: var(--dim);
        }
      `}</style>
    </>
  );
}