// src/components/UserDashboard/DashboardPanel.jsx
import React, { useContext } from 'react';
import { UserContext } from '../../pages/UserDashboard';

export default function DashboardPanel() {
  const { role, config, openPreview } = useContext(UserContext);
  const isGfx = role === 'gfx';
  const pct = isGfx ? 62 : 37;
  const dashArr = `${Math.round(pct / 100 * 176)} ${Math.round((1 - pct / 100) * 176)}`;
  
  const files = isGfx ? [
    { ext: 'PSD', icon: 'psd', name: 'brand_identity_v4.psd', size: '142 MB', date: 'Auj.' },
    { ext: 'PNG', icon: 'img', name: 'hero_illustration.png', size: '4.8 MB', date: 'Hier' },
    { ext: 'AI', icon: 'ai', name: 'logo_variants.ai', size: '8.2 MB', date: '25 mai' },
    { ext: 'GLB', icon: '3d', name: 'product_model.glb', size: '22 MB', date: '24 mai' },
  ] : [
    { ext: 'ZIP', icon: 'zip', name: 'api_assets_v2.zip', size: '48 MB', date: 'Auj.' },
    { ext: 'JSON', icon: 'json', name: 'config_prod.json', size: '12 KB', date: 'Hier' },
    { ext: 'PNG', icon: 'img', name: 'ui_mockups_v3.png', size: '2.1 MB', date: '25 mai' },
    { ext: 'MP4', icon: 'vid', name: 'demo_walkthrough.mp4', size: '186 MB', date: '24 mai' },
  ];

  return (
    <>
      <div className="kpi-row">
        <div className="kpi-card" style={{ '--kglow': `${config.accent}22` }}>
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: `${config.accent}22`, color: config.accent }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
            <span className="kpi-tag up">+14%</span>
          </div>
          <div className="kpi-value">{isGfx ? '1 247' : '284'}</div>
          <div className="kpi-label">Total assets</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'rgba(245,158,11,.15)', color: '#F59E0B' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className="kpi-tag up">+7%</span>
          </div>
          <div className="kpi-value">{isGfx ? '34' : '18'}</div>
          <div className="kpi-label">Uploads / semaine</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'rgba(139,92,246,.15)', color: '#8B5CF6' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 2,7 12,12 22,7" />
                <polyline points="2,17 12,22 22,17" />
                <polyline points="2,12 12,17 22,12" />
              </svg>
            </div>
            <span className="kpi-tag up">+3</span>
          </div>
          <div className="kpi-value">{isGfx ? '8' : '12'}</div>
          <div className="kpi-label">{isGfx ? 'Collections' : 'Projets actifs'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'rgba(239,68,68,.12)', color: '#EF4444' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <span className={`kpi-tag ${pct > 50 ? 'dn' : 'up'}`}>{pct}%</span>
          </div>
          <div className="kpi-value">{isGfx ? '31.2' : '18.4'}</div>
          <div className="kpi-label">GB utilisés</div>
        </div>
      </div>

      <div className="cols2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Uploads récents</span>
            <button className="btn btn-sm">Voir tout</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fichier</th><th>Taille</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={i}>
                  <td>
                    <div className="file-cell">
                      <div className={`file-icon ${f.icon}`}>{f.ext}</div>
                      <div>
                        <div className="fn" style={{ fontWeight: 500 }}>{f.name}</div>
                        <div className="fm" style={{ fontSize: 10, color: 'var(--muted)' }}>{config.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>{f.size}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--dim)' }}>{f.date}</td>
                  <td>
                    <div className="action-group">
                      <button className="action-btn" onClick={() => openPreview(f.name)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7,10 12,15 17,10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Stockage</span>
          </div>
          <div className="ring-box" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
            <div className="ring" style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              <svg viewBox="0 0 72 72" width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="8" />
                <circle cx="36" cy="36" r="28" fill="none" stroke={config.accent} strokeWidth="8"
                  strokeDasharray={dashArr} strokeLinecap="round" />
              </svg>
              <div className="ring-c" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="ring-pct" style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800 }}>{pct}%</div>
                <div className="ring-lbl" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--dim)' }}>utilisé</div>
              </div>
            </div>
            <div className="ring-details" style={{ flex: 1 }}>
              <div className="rd-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span className="rd-lbl" style={{ color: 'var(--muted)' }}>Utilisé</span>
                <span className="rd-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 500 }}>{isGfx ? '31.2' : '18.4'} GB</span>
              </div>
              <div className="rd-bar" style={{ height: 3, background: 'rgba(255,255,255,.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div className="rd-fill" style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: config.accent }} />
              </div>
              <div className="rd-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span className="rd-lbl" style={{ color: 'var(--muted)' }}>Libre</span>
                <span className="rd-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 500 }}>{isGfx ? '18.8' : '31.6'} GB</span>
              </div>
              <div className="rd-bar" style={{ height: 3, background: 'rgba(255,255,255,.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div className="rd-fill" style={{ width: `${100 - pct}%`, height: '100%', borderRadius: 2, background: 'rgba(255,255,255,.08)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}