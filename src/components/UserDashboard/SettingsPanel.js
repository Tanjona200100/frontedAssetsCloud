// src/components/UserDashboard/SettingsPanel.jsx
import React, { useContext } from 'react';
import { UserContext } from '../../pages/UserDashboard';

export default function SettingsPanel() {
  const { config, role } = useContext(UserContext);
  const isGfx = role === 'gfx';
  const pct = isGfx ? 62 : 37;

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="setsec" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 18, marginBottom: 12 }}>
        <div className="ss-title" style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Préférences
        </div>
        <div className="trow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--b2)' }}>
          <div><div className="tl" style={{ fontSize: 13, color: 'var(--text)' }}>Notifications par email</div><div className="tsub" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)' }}>Alertes upload et activité</div></div>
          <button className="tog on" style={{ width: 36, height: 19, background: 'var(--green)', borderRadius: 20, cursor: 'pointer', position: 'relative', border: 'none', flexShrink: 0 }} />
        </div>
        <div className="trow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--b2)' }}>
          <div><div className="tl">Compression automatique</div><div className="tsub">Optimiser les images à l'upload</div></div>
          <button className="tog on" />
        </div>
        <div className="trow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0' }}>
          <div><div className="tl">Aperçu au survol</div><div className="tsub">Prévisualiser les assets</div></div>
          <button className="tog" />
        </div>
      </div>
      <div className="setsec" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 18, marginBottom: 12 }}>
        <div className="ss-title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          Stockage
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
            <span>Espace utilisé</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text)' }}>{isGfx ? '31.2' : '18.4'} GB / 50 GB</span>
          </div>
          <div className="rd-bar" style={{ height: 6, background: 'rgba(255,255,255,.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 0 }}>
            <div className="rd-fill" style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: config.accent }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <button className="btn">Vider la corbeille</button>
          <button className="btn">Exporter mes données</button>
        </div>
      </div>
      <div className="setsec" style={{ background: 'rgba(12,22,40,.8)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 18, marginBottom: 12 }}>
        <div className="ss-title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Sécurité
        </div>
        <div className="trow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--b2)' }}>
          <div><div className="tl">Double authentification</div><div className="tsub">Sécuriser votre compte</div></div>
          <button className="tog" />
        </div>
        <div className="trow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0' }}>
          <div><div className="tl">Sessions actives</div><div className="tsub">2 appareils connectés</div></div>
          <button className="btn btn-sm">Gérer</button>
        </div>
      </div>
      <button className="btn" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,.25)' }}>Supprimer mon compte</button>
    </div>
  );
}