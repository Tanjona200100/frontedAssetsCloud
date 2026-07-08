// components/AdminDashboard/PreviewModal.jsx
import React from 'react';

// Supprimer le UserContext car on n'en a pas besoin dans l'admin
export default function PreviewModal({ isOpen, onClose, data }) {
  // Couleur accent par défaut pour l'admin
  const accentColor = '#3B82F6';
  
  if (!isOpen) return null;
  
  const ext = data?.name?.split('.').pop()?.toLowerCase() || '';
  const assetName = data?.title || data?.name || 'fichier';
  const assetDescription = data?.description || '';
  
  let previewContent;
  
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'bmp'].includes(ext)) {
    // Si on a une URL, on affiche l'image
    const imageUrl = data?.capture_url || data?.url || data?.file_url;
    if (imageUrl) {
      previewContent = (
        <img 
          src={imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL.replace('/api', '')}${imageUrl}`}
          alt={assetName}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '400px', 
            objectFit: 'contain',
            borderRadius: 8
          }}
        />
      );
    } else {
      previewContent = (
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)' }}>{assetName}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Aperçu image</div>
        </div>
      );
    }
  } else if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) {
    const videoUrl = data?.file_url || data?.url;
    if (videoUrl) {
      previewContent = (
        <video 
          controls 
          style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 8 }}
          src={videoUrl.startsWith('http') ? videoUrl : `${API_BASE_URL.replace('/api', '')}${videoUrl}`}
        />
      );
    } else {
      previewContent = (
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1">
            <polygon points="23,7 16,12 23,17" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)' }}>{assetName}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Lecteur vidéo</div>
        </div>
      );
    }
  } else if (['glb', 'obj', 'fbx', 'stl', 'gltf', 'dae', '3ds'].includes(ext)) {
    previewContent = (
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)' }}>{assetName}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Modèle 3D</div>
        {data?.triangle_count && (
          <div style={{ fontSize: 10, color: '#10b981', marginTop: 4 }}>
            {data.triangle_count.toLocaleString()} triangles
          </div>
        )}
      </div>
    );
  } else {
    // Fichier générique
    previewContent = (
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13,2 13,9 20,9" />
        </svg>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)' }}>{assetName}</div>
        {assetDescription && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{assetDescription}</div>
        )}
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          Type: {data?.file_type || ext || 'Inconnu'}
          {data?.file_size && ` • ${formatFileSize(data.file_size)}`}
        </div>
      </div>
    );
  }
  
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" style={{ width: 560, maxWidth: '95vw' }}>
        <div className="modal-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,.06)'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>
              Aperçu — {assetName}
            </div>
            {data?.category_name && (
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                {data.category_name}
              </div>
            )}
          </div>
          <button 
            className="modal-close" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: 24,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ×
          </button>
        </div>
        
        <div className="preview-box" style={{ 
          padding: '20px',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,.2)'
        }}>
          {previewContent}
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          justifyContent: 'flex-end',
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,.06)'
        }}>
          <button 
            className="btn-cancel" 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,.1)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
          <button 
            className="btn-confirm"
            onClick={() => {
              if (data?.id) {
                // Appeler la fonction de téléchargement
                window.downloadAsset?.(data.id);
              }
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#3B82F6',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}

// Fonction helper pour formater la taille
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

// Ajouter le base URL pour les assets
const API_BASE_URL = process.env.REACT_APP_API_URL;