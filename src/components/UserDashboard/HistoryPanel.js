// src/components/UserDashboard/HistoryPanel.jsx
import React from 'react';

export default function HistoryPanel() {
  const rows = [
    { ext: 'ZIP', icon: 'zip', name: 'backend_modules.zip', size: '124 MB', action: 'Upload', date: '28 mai · 14:22' },
    { ext: 'JSON', icon: 'json', name: 'config_prod.json', size: '8 KB', action: 'Upload', date: '27 mai · 09:45' },
    { ext: 'PNG', icon: 'img', name: 'ui_mockup_v4.png', size: '2.1 MB', action: 'Upload', date: '26 mai · 16:10' },
    { ext: 'MP4', icon: 'vid', name: 'demo_recording.mp4', size: '186 MB', action: 'Upload', date: '25 mai · 11:38' },
    { ext: 'ZIP', icon: 'zip', name: 'frontend_build.zip', size: '88 MB', action: 'Supprimé', date: '24 mai · 08:55' },
    { ext: 'JSON', icon: 'json', name: 'api_schema_v2.json', size: '14 KB', action: 'Modifié', date: '23 mai · 13:20' },
  ];
  
  const actionColors = { Upload: 'var(--green)', Supprimé: 'var(--red)', Modifié: 'var(--amber)' };

  return (
    <div className="tbl-wrap" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
      <div className="tbl-top" style={{ padding: '14px 18px' }}>
        <span className="card-title">Historique des uploads</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="hist-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,.025)' }}>
          <div className={`file-icon ${r.icon}`}>{r.ext}</div>
          <div style={{ flex: 1 }}>
            <div className="fn" style={{ fontWeight: 500 }}>{r.name}</div>
            <div className="fm" style={{ fontSize: 10, color: 'var(--muted)' }}>{r.size}</div>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: actionColors[r.action] }}>{r.action}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 16 }}>{r.date}</span>
        </div>
      ))}
      <div className="pag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--b2)' }}>
        <span className="pag-i" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)' }}>1–6 / 284</span>
        <div className="pag-btns" style={{ display: 'flex', gap: 3 }}>
          <button className="pb on" style={{ width: 27, height: 27, borderRadius: 5, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.4)', color: 'var(--blue)' }}>1</button>
          <button className="pb">2</button>
          <button className="pb">…</button>
        </div>
      </div>
    </div>
  );
}