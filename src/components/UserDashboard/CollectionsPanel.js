// src/components/UserDashboard/CollectionsPanel.jsx
import React, { useContext } from 'react';
import { UserContext } from '../../pages/UserDashboard';

export default function CollectionsPanel() {
  const { openModal } = useContext(UserContext);
  
  const collections = [
    { name: 'Identité visuelle', count: '48 assets', bg: 'rgba(59,130,246,.15)', color: '#3B82F6', icon: 'layers' },
    { name: 'UI Components', count: '124 assets', bg: 'rgba(16,185,129,.15)', color: '#10B981', icon: 'image' },
    { name: 'Photographies', count: '312 assets', bg: 'rgba(245,158,11,.15)', color: '#F59E0B', icon: 'camera' },
    { name: 'Modèles 3D', count: '18 assets', bg: 'rgba(244,114,182,.15)', color: '#F472B6', icon: 'file' },
    { name: 'Vidéos Brand', count: '24 assets', bg: 'rgba(139,92,246,.15)', color: '#8B5CF6', icon: 'video' },
    { name: 'Illustrations', count: '87 assets', bg: 'rgba(16,185,129,.15)', color: '#10B981', icon: 'layers' },
    { name: 'Icons & SVG', count: '203 assets', bg: 'rgba(59,130,246,.15)', color: '#3B82F6', icon: 'image' },
  ];

  const getIcon = (type, color) => {
    switch(type) {
      case 'layers':
        return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/></svg>;
      case 'image':
        return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>;
      case 'camera':
        return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
      case 'video':
        return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
      default:
        return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13,2 13,9 20,9"/></svg>;
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span className="card-title" style={{ fontSize: 14 }}>Collections</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>8 collections</span>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('collection')}>+ Nouvelle collection</button>
      </div>
      <div className="collections-grid">
        {collections.map(c => (
          <div key={c.name} className="collection-card">
            <div className="collection-icon" style={{ background: c.bg, color: c.color }}>
              {getIcon(c.icon, c.color)}
            </div>
            <div className="collection-name">{c.name}</div>
            <div className="collection-count">{c.count}</div>
          </div>
        ))}
        <div className="collection-card collection-new" onClick={() => openModal('collection')} style={{ cursor: 'pointer' }}>
          <div className="collection-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div className="collection-new-lbl" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Nouvelle collection</div>
        </div>
      </div>
    </>
  );
}