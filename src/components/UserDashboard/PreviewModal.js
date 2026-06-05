// src/components/UserDashboard/PreviewModal.jsx
import React, { useContext } from 'react';
import { UserContext } from '../../pages/UserDashboard';

export default function PreviewModal({ isOpen, onClose, data }) {
  const { config } = useContext(UserContext);
  
  if (!isOpen) return null;
  
  const ext = data.name?.split('.').pop()?.toLowerCase() || '';
  let previewContent;
  
  if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) {
    previewContent = (
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={config.accent} strokeWidth="1">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)' }}>{data.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Aperçu image</div>
      </div>
    );
  } else if (['mp4', 'mov', 'webm'].includes(ext)) {
    previewContent = (
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={config.accent} strokeWidth="1">
          <polygon points="23,7 16,12 23,17" />
          <rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)' }}>{data.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Lecteur vidéo</div>
      </div>
    );
  } else if (['glb', 'obj', 'fbx', 'stl'].includes(ext)) {
    previewContent = (
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={config.accent} strokeWidth="1">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)' }}>{data.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Aperçu 3D</div>
      </div>
    );
  } else {
    previewContent = (
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={config.accent} strokeWidth="1">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13,2 13,9 20,9" />
        </svg>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)' }}>{data.name}</div>
      </div>
    );
  }
  
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" style={{ width: 480 }}>
        <div className="modal-title">Aperçu — {data.name || 'fichier'}</div>
        <div className="preview-box">{previewContent}</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={onClose}>Fermer</button>
          <button className="btn-confirm">Télécharger</button>
        </div>
      </div>
    </div>
  );
}