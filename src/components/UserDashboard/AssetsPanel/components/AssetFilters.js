// src/components/UserDashboard/components/AssetFilters.jsx

import React from 'react';
import { MdFilterList, MdClose } from 'react-icons/md';
import { LiaTagSolid, LiaFolderOpen } from 'react-icons/lia';

export default function AssetFilters({
  showFilters,
  setShowFilters,
  filters,
  handleFilterChange,
  resetFilters,
  activeFiltersCount,
  categories,
  projects
}) {
  return (
    <>
      <button
        onClick={() => setShowFilters(!showFilters)}
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
          onClick={resetFilters}
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

      {showFilters && (
        <div style={{
          padding: '16px 18px',
          borderTop: '1px solid rgba(255,255,255,.06)',
          background: 'rgba(0,0,0,.2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
          width: '100%'
        }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>
              <LiaTagSolid size={12} style={{ marginRight: 4 }} />
              Catégorie
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
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
              onChange={(e) => handleFilterChange('project', e.target.value)}
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
              onChange={(e) => handleFilterChange('file_type', e.target.value)}
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
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="3d_model">🎮 Modèles 3D</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="archive">📦 Archives</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="image">🖼️ Images</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="video">🎬 Vidéos</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="audio">🎵 Audio</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="document">📄 Documents</option>
              <option style={{ background: 'rgba(0,0,0)', color: 'white' }} value="other">📎 Autres</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>Visibilité</label>
            <select
              value={filters.visibility}
              onChange={(e) => handleFilterChange('visibility', e.target.value)}
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
        </div>
      )}
    </>
  );
}