// components/AdminDashboard/AssetsPanel.jsx
import { useState } from "react";

const assetsData = [
  { id: 1, name: "hero_banner_v3.png", owner: "Marie Laurent", size: "4.2 MB", date: "28 mai 2026", type: "img", ext: "PNG" },
  { id: 2, name: "product_demo_final.mp4", owner: "Thomas Remy", size: "248 MB", date: "27 mai 2026", type: "vid", ext: "MP4" },
  { id: 3, name: "character_model_v2.glb", owner: "Sophie Bernard", size: "18.6 MB", date: "26 mai 2026", type: "three", ext: "GLB" },
  { id: 4, name: "brand_assets_2026.zip", owner: "Marie Laurent", size: "92.1 MB", date: "24 mai 2026", type: "img", ext: "ZIP" },
  { id: 5, name: "scene_environment.obj", owner: "Thomas Remy", size: "34.5 MB", date: "23 mai 2026", type: "three", ext: "OBJ" },
];

const getFileTypeClass = (type) => {
  switch (type) {
    case "img": return "ftype-dot img";
    case "vid": return "ftype-dot vid";
    case "three": return "ftype-dot three";
    default: return "ftype-dot";
  }
};

const getFileTypeText = (type) => {
  switch (type) {
    case "img": return "IMG";
    case "vid": return "VID";
    case "three": return "3D";
    default: return "FILE";
  }
};

const AssetsPanel = ({ searchQuery }) => {
  const [filterType, setFilterType] = useState("Tous les types");

  const filteredAssets = assetsData.filter(asset =>
    (filterType === "Tous les types" || 
      (filterType === "Images" && asset.type === "img") ||
      (filterType === "Vidéos" && asset.type === "vid") ||
      (filterType === "3D" && asset.type === "three")) &&
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ActionButtons = () => (
    <div className="action-btns">
      <button className="a-btn" title="Voir">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      <button className="a-btn del" title="Supprimer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3,6 5,6 21,6" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="table-card">
      <div className="table-top">
        <span className="card-title" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px" }}>
          Gestion des Assets
        </span>
        <div className="table-actions">
          <select 
            className="btn-sm" 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ border: "1px solid var(--border)", background: "rgba(30,41,59,0.6)", color: "var(--text-muted)", borderRadius: "7px", fontSize: "12px", padding: "6px 10px", outline: "none", fontFamily: "inherit", cursor: "pointer" }}
          >
            <option>Tous les types</option>
            <option>Images</option>
            <option>Vidéos</option>
            <option>3D</option>
          </select>
          <button className="btn-sm">Rechercher</button>
        </div>
      </div>
      <table>
        <thead>
          <tr><th>Fichier</th><th>Propriétaire</th><th>Taille</th><th>Upload</th><th>Type</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filteredAssets.map(asset => (
            <tr key={asset.id}>
              <td style={{ fontWeight: "500" }}>{asset.name}</td>
              <td style={{ color: "var(--text-muted)" }}>{asset.owner}</td>
              <td style={{ color: "var(--text-muted)" }}>{asset.size}</td>
              <td style={{ color: "var(--text-muted)" }}>{asset.date}</td>
              <td>
                <span className="ftype">
                  <span className={getFileTypeClass(asset.type)}>{getFileTypeText(asset.type)}</span>
                  {asset.ext}
                </span>
              </td>
              <td><ActionButtons /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pag">
        <span className="pag-info">Affichage 1–{filteredAssets.length} sur 199 741 assets</span>
        <div className="pag-btns">
          <button className="pag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <button className="pag-btn cur">1</button>
          <button className="pag-btn">2</button>
          <button className="pag-btn">3</button>
          <button className="pag-btn">…</button>
          <button className="pag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetsPanel;