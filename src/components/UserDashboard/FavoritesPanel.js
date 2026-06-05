// src/components/UserDashboard/FavoritesPanel.jsx
import React from 'react';

export default function FavoritesPanel() {
  const gradients = [
    'radial-gradient(circle,rgba(59,130,246,.5),rgba(16,185,129,.3))',
    'radial-gradient(circle,rgba(244,114,182,.5),rgba(139,92,246,.3))',
    'radial-gradient(circle,rgba(245,158,11,.5),rgba(239,68,68,.2))',
    'radial-gradient(circle,rgba(16,185,129,.5),rgba(59,130,246,.3))',
    'radial-gradient(circle,rgba(139,92,246,.5),rgba(244,114,182,.3))',
    'radial-gradient(circle,rgba(59,130,246,.4),rgba(245,158,11,.2))',
  ];
  const names = ['hero_v4.png', 'brand_logo.ai', 'motion_intro.mp4', 'icon_pack.svg', 'chair_3d.glb', 'poster_final.psd'];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span className="card-title" style={{ fontSize: 14 }}>Favoris</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>47 assets</span>
        </div>
      </div>
      <div className="fav-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginBottom: 16 }}>
        {gradients.map((g, i) => (
          <div key={i} className="fav" style={{ aspectRatio: 1, borderRadius: 9, overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', background: g, position: 'relative', transition: 'all .2s' }}>
            <div className="fav-heart" style={{ position: 'absolute', top: 5, right: 5, color: '#F472B6' }}>
              <svg viewBox="0 0 24 24" fill="#F472B6" stroke="currentColor" strokeWidth="2" width="11" height="11">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div className="fav-lbl" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', fontSize: 10, fontWeight: 500, color: 'var(--text)', background: 'linear-gradient(transparent,rgba(2,6,23,.8))' }}>{names[i]}</div>
          </div>
        ))}
      </div>
    </>
  );
}