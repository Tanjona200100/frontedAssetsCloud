// src/components/UserDashboard/components/UploadModal.jsx

import React from 'react';
import { LiaGlobeSolid, LiaLockSolid, LiaImageSolid } from 'react-icons/lia';
import { formatSize } from '../assets/utils';

export default function UploadModal({
  showUploadModal,
  setShowUploadModal,
  uploading,
  selectedFiles,
  uploadTitle,
  setUploadTitle,
  uploadDescription,
  setUploadDescription,
  uploadVisibility,
  setUploadVisibility,
  uploadTriangleCount,
  setUploadTriangleCount,
  selectedProject,
  setSelectedProject,
  selectedCategory,
  setSelectedCategory,
  uploadCapturePreview,
  uploadCapture,
  setUploadCapture,
  setUploadCapturePreview,
  handleFileSelect,
  removeFile,
  handleCaptureSelect,
  handleSubmit,
  resetUploadForm,
  projects,
  categories,
  showNotification
}) {
  if (!showUploadModal) return null;

  return (
    <div className="modal-overlay" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>
      <div className="upload-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <div className="upload-modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="upload-modal-title-section">
            <h3 className="upload-modal-title">Uploader des assets</h3>
            <p className="upload-modal-subtitle">Ajoutez jusqu'à 10 fichiers • Max 500 MB par fichier</p>
          </div>
          <button className="upload-modal-close" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="upload-modal-body">
            <div className="upload-dropzone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files); if (files.length > 0 && files.length <= 10) { const input = document.getElementById('file-upload-input'); if (input) { const dt = new DataTransfer(); files.forEach(f => dt.items.add(f)); input.files = dt.files; handleFileSelect({ target: input }); } } else if (files.length > 10) { showNotification('warning', '⚠️ Trop de fichiers', 'Maximum 10 fichiers'); } }}>
              <input type="file" id="file-upload-input" multiple onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,video/*,.glb,.gltf,.fbx,.obj,.zip,.rar,.7z,.psd,.ai,.json,.pdf,.doc,.docx" />
              <label htmlFor="file-upload-input" className="upload-dropzone-label">
                <div className="upload-dropzone-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="upload-dropzone-title">Cliquez ou glissez-déposez</div>
                <div className="upload-dropzone-hint">PNG, JPG, MP4, GLB, FBX, OBJ, ZIP, PSD, AI, PDF...</div>
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <div className="upload-files-list">
                <div className="upload-files-header">
                  <span className="upload-files-count">{selectedFiles.length} fichier(s) sélectionné(s)</span>
                  <button type="button" className="upload-files-clear" onClick={() => { const input = document.getElementById('file-upload-input'); if (input) input.value = ''; }}>Tout effacer</button>
                </div>
                <div className="upload-files-grid">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="upload-file-item">
                      <div className="upload-file-icon">{file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('video/') ? '🎬' : file.name.endsWith('.glb') || file.name.endsWith('.gltf') || file.name.endsWith('.fbx') || file.name.endsWith('.obj') ? '🎨' : file.name.endsWith('.zip') || file.name.endsWith('.rar') ? '📦' : file.name.endsWith('.psd') || file.name.endsWith('.ai') ? '🎯' : '📄'}</div>
                      <div className="upload-file-info">
                        <div className="upload-file-name" title={file.name}>{file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name}</div>
                        <div className="upload-file-size">{formatSize(file.size)}</div>
                      </div>
                      <button type="button" className="upload-file-remove" onClick={() => removeFile(index)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="upload-metadata">
              <div className="upload-metadata-row">
                <div className="upload-metadata-field">
                  <label className="upload-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M20 12v8H4v-8M12 2v12m0 0-3-3m3 3 3-3" /></svg>Titre par défaut</label>
                  <input type="text" className="upload-input" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Optionnel" />
                </div>
                <div className="upload-metadata-field">
                  <label className="upload-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    Nombre de triangles
                  </label>
                  <input
                    type="number"
                    className="upload-input"
                    value={uploadTriangleCount}
                    onChange={(e) => setUploadTriangleCount(e.target.value)}
                    placeholder="ex: 12450"
                  />
                  <div className="upload-hint">Nombre de polygones/triangles du modèle 3D</div>
                </div>
              </div>
              <div className="upload-metadata-row">
                <div className="upload-metadata-field">
                  <label className="upload-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                      <path d="M20 7h-4.18A3 3 0 0 0 16 5.18V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                    </svg>
                    Projet
                  </label>
                  <select
                    className="upload-select"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,.3)',
                      border: '1px solid rgba(255,255,255,.1)',
                      borderRadius: 6,
                      color: 'white',
                      fontSize: 13
                    }}
                  >
                    <option value="">Aucun projet</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <div className="upload-hint">Associer l'asset à un projet existant</div>
                </div>

                <div className="upload-metadata-field">
                  <label className="upload-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" />
                      <circle cx="8.5" cy="8.5" r="2.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    Catégorie
                  </label>
                  <select
                    className="upload-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,.3)',
                      border: '1px solid rgba(255,255,255,.1)',
                      borderRadius: 6,
                      color: 'white',
                      fontSize: 13
                    }}
                  >
                    <option value="">Aucune catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon || '🏷️'} {category.display_name}
                      </option>
                    ))}
                  </select>
                  <div className="upload-hint">Associer l'asset à une catégorie</div>
                </div>
              </div>
              <div className="upload-metadata-row">
                <div className="upload-metadata-field">
                  <label className="upload-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>Description</label>
                  <textarea className="upload-textarea" rows="2" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Optionnelle - Description commune à tous les fichiers" />
                </div>
                <div className="upload-metadata-field">
                  <label className="upload-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>Visibilité</label>
                  <div className="upload-visibility-options">
                    <label className="upload-radio"><input type="radio" value="public" checked={uploadVisibility === 'public'} onChange={(e) => setUploadVisibility(e.target.value)} /><span><LiaGlobeSolid /> Public</span></label>
                    <label className="upload-radio"><input type="radio" value="private" checked={uploadVisibility === 'private'} onChange={(e) => setUploadVisibility(e.target.value)} /><span><LiaLockSolid /> Privé</span></label>
                  </div>
                </div>
              </div>
              <div className="upload-metadata-field">
                <label className="upload-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" />
                    <circle cx="8.5" cy="8.5" r="2.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  Capture d'écran (aperçu 3D)
                </label>
                <div className="upload-capture-area">
                  <input
                    type="file"
                    id="capture-upload"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCaptureSelect}
                    style={{ display: 'none' }}
                  />
                  {uploadCapturePreview ? (
                    <div className="capture-preview">
                      <img src={uploadCapturePreview} alt="Aperçu" />
                      <button
                        type="button"
                        className="remove-capture"
                        onClick={() => {
                          setUploadCapture(null);
                          setUploadCapturePreview(null);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="capture-upload" className="capture-upload-label">
                      <div className="capture-upload-icon"><LiaImageSolid size={32} /></div>
                      <div>Cliquez pour ajouter une capture d'écran</div>
                      <div className="capture-upload-hint">JPG, PNG, WebP (max 10 MB)</div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="upload-modal-footer">
            <button type="button" className="upload-btn upload-btn-secondary" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>Annuler</button>
            <button type="submit" className="upload-btn upload-btn-primary" disabled={uploading || selectedFiles.length === 0}>
              {uploading ? (<><svg className="upload-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>Upload en cours...</>) : (<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>Uploader {selectedFiles.length} fichier(s)</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}