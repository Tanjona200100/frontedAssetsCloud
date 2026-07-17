// src/components/UserDashboard/assets/styles.js

export const styles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Styles pour la notification */
  .notif-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: notifFadeIn 0.3s ease-out;
  }

  .notif-popup {
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
    max-width: 480px;
    width: 90%;
    position: relative;
    overflow: hidden;
    animation: notifScaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    padding: 35px 30px 30px;
    border: 2px solid transparent;
  }

  .notif-popup.success {
    background: #f0fdf4;
    border-color: #86efac;
  }

  .notif-popup.error {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  .notif-popup.warning {
    background: #fffbeb;
    border-color: #fcd34d;
  }

  .notif-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .notif-icon-wrapper {
    margin-bottom: 16px;
  }

  .notif-icon {
    font-size: 56px;
    display: block;
  }

  .notif-icon.success {
    color: #22c55e;
  }

  .notif-icon.error {
    color: #ef4444;
  }

  .notif-icon.warning {
    color: #f59e0b;
  }

  .notif-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: #1f2937;
  }

  .notif-message {
    font-size: 15px;
    line-height: 1.6;
    color: #4b5563;
    margin: 0 0 6px 0;
    max-width: 380px;
  }

  .notif-close {
    position: absolute;
    top: 14px;
    right: 18px;
    background: none;
    border: none;
    font-size: 26px;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
    line-height: 1;
  }

  .notif-close:hover {
    color: #1f2937;
    background: rgba(0, 0, 0, 0.05);
  }

  .notif-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    background: #e5e7eb;
    animation: notifProgress 4s linear forwards;
    border-radius: 0 0 0 4px;
  }

  .notif-popup.success .notif-progress {
    background: #86efac;
  }

  .notif-popup.error .notif-progress {
    background: #fca5a5;
  }

  .notif-popup.warning .notif-progress {
    background: #fcd34d;
  }

  @keyframes notifFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes notifScaleIn {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes notifProgress {
    from { width: 100%; }
    to { width: 0%; }
  }

  /* Styles pour les modales */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .upload-modal-container {
    background: #0a0f1a;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 16px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .upload-modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,.1);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .upload-modal-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(59,130,246,.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3B82F6;
  }
  
  .upload-modal-title-section {
    flex: 1;
  }
  
  .upload-modal-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .upload-modal-subtitle {
    margin: 0;
    font-size: 12px;
    color: var(--dim);
  }
  
  .upload-modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
  }
  
  .upload-modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }
  
  .upload-dropzone {
    border: 2px dashed rgba(255,255,255,.1);
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 16px;
  }
  
  .upload-dropzone:hover {
    border-color: rgba(59,130,246,.4);
    background: rgba(59,130,246,.05);
  }
  
  .upload-dropzone-icon {
    color: #666;
    margin-bottom: 12px;
  }
  
  .upload-dropzone-title {
    font-size: 14px;
    color: var(--text);
    margin-bottom: 4px;
  }
  
  .upload-dropzone-hint {
    font-size: 11px;
    color: var(--dim);
  }
  
  .upload-files-list {
    margin-bottom: 16px;
  }
  
  .upload-files-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .upload-files-count {
    font-size: 12px;
    color: var(--dim);
  }
  
  .upload-files-clear {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 12px;
  }
  
  .upload-files-grid {
    display: grid;
    gap: 6px;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .upload-file-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(255,255,255,.05);
    border-radius: 6px;
  }
  
  .upload-file-icon {
    font-size: 20px;
  }
  
  .upload-file-info {
    flex: 1;
  }
  
  .upload-file-name {
    font-size: 12px;
    color: white;
  }
  
  .upload-file-size {
    font-size: 10px;
    color: var(--dim);
  }
  
  .upload-file-remove {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
  }
  
  .upload-file-remove:hover {
    color: #ef4444;
  }
  
  .upload-metadata {
    display: grid;
    gap: 12px;
  }
  
  .upload-metadata-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .upload-metadata-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .upload-label {
    font-size: 11px;
    color: var(--dim);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .upload-input,
  .upload-select,
  .upload-textarea {
    padding: 8px 12px;
    background: rgba(0,0,0,.3);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 6px;
    color: white;
    font-size: 13px;
    outline: none;
    width: 100%;
  }
  
  .upload-input:focus,
  .upload-select:focus,
  .upload-textarea:focus {
    border-color: #3B82F6;
  }
  
  .upload-textarea {
    resize: vertical;
    min-height: 60px;
  }
  
  .upload-visibility-options {
    display: flex;
    gap: 12px;
  }
  
  .upload-radio {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text);
    cursor: pointer;
  }
  
  .upload-radio input[type="radio"] {
    accent-color: #3B82F6;
  }
  
  .upload-hint {
    font-size: 10px;
    color: var(--dim);
    margin-top: 2px;
  }
  
  .upload-capture-area {
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    padding: 12px;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .capture-preview {
    position: relative;
    width: 100%;
    max-height: 200px;
  }
  
  .capture-preview img {
    width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 6px;
  }
  
  .remove-capture {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0,0,0,.7);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
  }
  
  .capture-upload-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 20px;
    width: 100%;
  }
  
  .capture-upload-icon {
    color: #666;
  }
  
  .capture-upload-hint {
    font-size: 10px;
    color: var(--dim);
  }
  
  .upload-btn {
    padding: 8px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
  }
  
  .upload-btn-secondary {
    background: rgba(255,255,255,.05);
    color: var(--text);
  }
  
  .upload-btn-secondary:hover {
    background: rgba(255,255,255,.1);
  }
  
  .upload-btn-primary {
    background: #3B82F6;
    color: white;
  }
  
  .upload-btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .upload-btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .upload-spinner {
    animation: spin 1s linear infinite;
    width: 16px;
    height: 16px;
  }
  
  .modal-container {
    background: #0a0f1a;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 16px;
    width: 90%;
    max-width: 450px;
    overflow: hidden;
  }

  .modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 16px;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255,255,255,.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .modal-btn {
    padding: 8px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    border: none;
    transition: all 0.2s;
  }

  .modal-btn-cancel {
    background: rgba(255,255,255,.05);
    color: var(--text);
  }

  .modal-btn-cancel:hover {
    background: rgba(255,255,255,.1);
  }

  .modal-btn-delete {
    background: #ef4444;
    color: white;
  }

  .modal-btn-delete:hover {
    background: #dc2626;
  }

  @media (max-width: 1200px) {
    .assets-grid {
      grid-template-columns: repeat(3, 1fr) !important;
    }
  }
  
  @media (max-width: 900px) {
    .assets-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
  
  @media (max-width: 600px) {
    .assets-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;