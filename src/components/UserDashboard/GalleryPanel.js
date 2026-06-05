// src/components/UserDashboard/GalleryPanel.jsx
import React, { useContext, useState } from 'react';
import { UserContext } from '../../pages/UserDashboard';

export default function GalleryPanel() {
  const { config, openPreview } = useContext(UserContext);
  const [activeFilter, setActiveFilter] = useState('Tous');
  
  const gradients = [
    'radial-gradient(circle at 30% 30%,rgba(59,130,246,.4),rgba(16,185,129,.2))',
    'radial-gradient(circle at 70% 30%,rgba(245,158,11,.4),rgba(239,68,68,.15))',
    'radial-gradient(circle at 50% 50%,rgba(139,92,246,.4),rgba(59,130,246,.2))',
    'radial-gradient(circle at 20% 70%,rgba(244,114,182,.4),rgba(139,92,246,.15))',
    'radial-gradient(circle at 80% 20%,rgba(245,158,11,.4),rgba(16,185,129,.15))',
    'radial-gradient(circle at 40% 60%,rgba(16,185,129,.4),rgba(59,130,246,.2))',
    'radial-gradient(circle at 60% 40%,rgba(59,130,246,.35),rgba(16,185,129,.25))',
    'radial-gradient(circle at 30% 60%,rgba(239,68,68,.25),rgba(245,158,11,.2))',
  ];
  
  const files = [
    { ext: 'PNG', icon: 'img', name: 'hero_v4.png', size: '5.4 MB' },
    { ext: 'MP4', icon: 'vid', name: 'brand_reel.mp4', size: '94 MB' },
    { ext: 'PSD', icon: 'psd', name: 'homepage.psd', size: '218 MB' },
    { ext: 'GLB', icon: '3d', name: 'chair_v2.glb', size: '47 MB' },
    { ext: 'AI', icon: 'ai', name: 'icons.ai', size: '3.8 MB' },
    { ext: 'PNG', icon: 'img', name: 'banner_01.png', size: '2.1 MB' },
    { ext: 'SVG', icon: 'img', name: 'logo_set.svg', size: '480 KB' },
    { ext: 'MOV', icon: 'vid', name: 'teaser.mov', size: '312 MB' },
  ];
  
  const filters = ['Tous', 'Images', 'Vidéos', '3D', 'PSD/AI', 'SVG'];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span className="card-title" style={{ fontSize: 14 }}>Galerie</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>1 247 assets</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary">+ Upload</button>
        </div>
      </div>
      <div className="gal-filters" style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button 
            key={f}
            className={`gal-filt ${activeFilter === f ? 'on' : ''}`}
            onClick={() => setActiveFilter(f)}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, padding: '5px 12px', borderRadius: 5, border: '1px solid rgba(255,255,255,.08)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="gallery-grid">
        {files.map((f, i) => (
          <div key={f.name} className="gallery-item">
            <div className="gallery-thumb" style={{ background: gradients[i % gradients.length] }}>
              <div className={`file-icon ${f.icon}`} style={{ width: 34, height: 34, fontSize: 9 }}>{f.ext}</div>
              <div className="gallery-overlay">
                <button className="action-btn" style={{ background: 'rgba(2,6,23,.7)' }} onClick={() => openPreview(f.name)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button className="action-btn" style={{ background: 'rgba(2,6,23,.7)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="gallery-footer">
              <div className="gallery-name">{f.name}</div>
              <div className="gallery-size">{f.size}</div>
            </div>
            <span className="gallery-badge">{f.ext}</span>
            <button className={`heart-btn ${i === 0 || i === 2 ? 'active' : ''}`} onClick={(e) => e.currentTarget.classList.toggle('active')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        ))}
        <div className="gallery-item" style={{ borderStyle: 'dashed', opacity: 0.3, cursor: 'pointer' }}>
          <div className="gallery-thumb" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, color: 'var(--muted)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span style={{ fontSize: 11 }}>Ajouter</span>
          </div>
        </div>
      </div>
    </>
  );
}