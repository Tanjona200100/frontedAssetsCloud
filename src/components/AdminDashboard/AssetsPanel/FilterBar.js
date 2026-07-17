// components/AdminDashboard/AssetsPanel/FilterBar.jsx

import { LiaTagSolid, LiaFolderOpen, LiaUserSolid } from 'react-icons/lia';
import { MdFilterList, MdClose } from 'react-icons/md';

const FilterBar = ({ 
  filters, 
  onFilterChange, 
  onReset, 
  showFilters, 
  onToggleFilters, 
  activeFiltersCount,
  categories,
  projects,
  users 
}) => {
  return (
    <>
      <div className="tbl-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <span className="card-title">Gestion des Assets</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dim)', marginLeft: 10 }}>
              {activeFiltersCount > 0 && `• ${activeFiltersCount} filtre(s) actif(s)`}
            </span>
          </div>

          <button
            onClick={onToggleFilters}
            style={{
              background: showFilters ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.05)',
              border: `1px solid ${showFilters ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.1)'}`,
              borderRadius: 6,
              padding: '4px 10px',
              color: showFilters ? '#3B82F6' : 'var(--dim)',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <MdFilterList size={14} />
            Filtres
            {activeFiltersCount > 0 && (
              <span style={{
                background: '#3B82F6',
                color: 'white',
                borderRadius: '50%',
                padding: '1px 6px',
                fontSize: 10,
                marginLeft: 2
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 6,
                padding: '4px 10px',
                color: 'var(--dim)',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <MdClose size={14} />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Panneau des filtres avancés */}
      {showFilters && (
        <div style={{
          padding: '16px 18px',
          borderTop: '1px solid rgba(255,255,255,.06)',
          background: 'rgba(0,0,0,.2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>
              <LiaTagSolid size={12} style={{ marginRight: 4 }} />
              Catégorie
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 6,
                color: 'white',
                fontSize: 12
              }}
            >
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Toutes</option>
              {categories.map(cat => (
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} key={cat.id} value={cat.id}>
                  {cat.icon || '📁'} {cat.display_name || cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>
              <LiaFolderOpen size={12} style={{ marginRight: 4 }} />
              Projet
            </label>
            <select
              value={filters.project}
              onChange={(e) => onFilterChange('project', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 6,
                color: 'white',
                fontSize: 12
              }}
            >
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Tous</option>
              {projects.map(project => (
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>Type</label>
            <select
              value={filters.file_type}
              onChange={(e) => onFilterChange('file_type', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 6,
                color: 'white',
                fontSize: 12
              }}
            >
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Tous</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="image">🖼️ Images</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="video">🎬 Vidéos</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="3d_model">🎮 Modèles 3D</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="archive">📦 Archives</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="document">📄 Documents</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="audio">🎵 Audio</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="other">📎 Autres</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>Visibilité</label>
            <select
              value={filters.visibility}
              onChange={(e) => onFilterChange('visibility', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 6,
                color: 'white',
                fontSize: 12
              }}
            >
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Toutes</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="public">🌍 Public</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="private">🔒 Privé</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>
              <LiaUserSolid size={12} style={{ marginRight: 4 }} />
              Créateur
            </label>
            <select
              value={filters.created_by}
              onChange={(e) => onFilterChange('created_by', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 6,
                color: 'white',
                fontSize: 12
              }}
            >
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="">Tous</option>
              {users.map(user => (
                <option style={{ background: 'rgba(0,0,0)', color: 'white' }} key={user.id} value={user.id}>
                  {user.first_name || user.name || user.email || `Utilisateur ${user.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterBar;