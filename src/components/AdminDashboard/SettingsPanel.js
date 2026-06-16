// components/AdminDashboard/SettingsPanel.jsx
import { useState } from "react";

const Toggle = ({ label, sublabel, defaultOn = false }) => {
  const [isOn, setIsOn] = useState(defaultOn);
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        <div className="toggle-sub">{sublabel}</div>
      </div>
      <button className={`toggle ${isOn ? "on" : ""}`} onClick={() => setIsOn(!isOn)}></button>
    </div>
  );
};

const SettingsPanel = () => {
  const categories = ["Images", "Vidéos", "Fichiers 3D", "Audio"];
  const categoryColors = {
    Images: { color: "var(--accent-blue)", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)" },
    Vidéos: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" },
    "Fichiers 3D": { color: "#A78BFA", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.3)" },
    Audio: { color: "var(--text-muted)", bg: "rgba(30,41,59,0.4)", border: "var(--border)" }
  };

  return (
    <div className="settings-grid">
      <div className="settings-card">
        <div className="settings-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Général
        </div>
        <div className="field-row">
          <label className="field-label">Nom de la plateforme</label>
          <input className="field-input" defaultValue="AssetCloud" />
        </div>
        <div className="field-row">
          <label className="field-label">URL de la plateforme</label>
          <input className="field-input" defaultValue="https://assetcloud.io" />
        </div>
        <div className="field-row">
          <label className="field-label">Email de contact</label>
          <input className="field-input" defaultValue="admin@assetcloud.io" />
        </div>
        <div style={{ marginTop: "16px" }}>
          <button className="btn-sm primary">Sauvegarder</button>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          Stockage
        </div>
        <div className="field-row">
          <label className="field-label">Limite par utilisateur</label>
          <input className="field-input" defaultValue="50 GB" />
        </div>
        <div className="field-row">
          <label className="field-label">Stockage total alloué</label>
          <input className="field-input" defaultValue="2 TB" />
        </div>
        <div style={{ marginTop: "4px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
            <span>Espace utilisé</span>
            <span>1.34 TB / 2 TB</span>
          </div>
          <div className="storage-bar"><div className="storage-fill" style={{ width: "67%" }}></div></div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <button className="btn-sm primary">Mettre à jour</button>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Sécurité
        </div>
        <Toggle label="Double authentification" sublabel="Activer pour tous les admins" defaultOn={true} />
        <Toggle label="Restriction IP" sublabel="Limiter aux IPs approuvées" defaultOn={false} />
        <Toggle label="Logs d'audit" sublabel="Enregistrer toutes les actions" defaultOn={true} />
      </div>

     
    </div>
  );
};

export default SettingsPanel;