// src/components/UserDashboard/ProjectsPanel.jsx
import React, { useContext } from 'react';
import { UserContext } from '../../pages/UserDashboard';

export default function ProjectsPanel() {
  const { openModal } = useContext(UserContext);
  
  const items = [
    { name: 'API Gateway v3', files: '47 fichiers', status: 'Actif', bg: 'rgba(59,130,246,.15)', color: '#3B82F6', tags: ['REST', 'JSON', 'ZIP'] },
    { name: 'Dashboard UI', files: '32 fichiers', status: 'Actif', bg: 'rgba(16,185,129,.15)', color: '#10B981', tags: ['PNG', 'MP4'] },
    { name: 'Mobile App Assets', files: '124 fichiers', status: 'Pausé', bg: 'rgba(139,92,246,.15)', color: '#8B5CF6', tags: ['PNG', 'SVG'] },
    { name: 'Backend Modules', files: '67 fichiers', status: 'Actif', bg: 'rgba(245,158,11,.15)', color: '#F59E0B', tags: ['ZIP', 'JSON'] },
    { name: 'DevOps Config', files: '19 fichiers', status: 'Archivé', bg: 'rgba(71,85,105,.2)', color: '#9CA3AF', tags: ['YAML', 'JSON'] },
    { name: 'Test Suite', files: '41 fichiers', status: 'Actif', bg: 'rgba(239,68,68,.12)', color: '#EF4444', tags: ['JSON', 'PNG'] },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span className="card-title" style={{ fontSize: 14 }}>Mes projets</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>12 dossiers</span>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('folder')}>+ Nouveau projet</button>
      </div>
      <div className="proj-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12, marginBottom: 16 }}>
        {items.map(p => (
          <div key={p.name} className="proj" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
            <div className="proj-cover" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.bg, position: 'relative' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="proj-body" style={{ padding: '12px 14px' }}>
              <div className="proj-name" style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700 }}>{p.name}</div>
              <div className="proj-meta" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--muted)' }}>{p.files} · {p.status}</div>
            </div>
            <div className="proj-foot" style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
              {p.tags.map(t => <span key={t} className="ptag" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(255,255,255,.07)', color: 'var(--muted)' }}>{t}</span>)}
            </div>
          </div>
        ))}
        <div className="proj proj-new" onClick={() => openModal('folder')} style={{ cursor: 'pointer', borderStyle: 'dashed', opacity: 0.35, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Nouveau projet</div>
        </div>
      </div>
    </>
  );
}