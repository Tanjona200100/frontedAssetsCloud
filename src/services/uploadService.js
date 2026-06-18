const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

class UploadService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.chunkSize = 10 * 1024 * 1024; // 10 MB par chunk
    this.uploadId = null;
    this.abortController = null;
  }

  /**
   * Upload un fichier avec gestion automatique (standard ou chunks)
   */
  async uploadFile(file, onProgress, metadata = {}) {
    // Seuil pour l'upload en chunks (100 MB)
    const CHUNK_THRESHOLD = 100 * 1024 * 1024;
    
    if (file.size < CHUNK_THRESHOLD) {
      return this.uploadStandard(file, onProgress, metadata);
    }
    
    return this.uploadChunks(file, onProgress, metadata);
  }

  /**
   * Upload standard (pour fichiers < 100 MB)
   */
  async uploadStandard(file, onProgress, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title || file.name);
    formData.append('description', metadata.description || '');
    formData.append('visibility', metadata.visibility || 'private');
    
    if (metadata.categories) formData.append('categories', metadata.categories);
    if (metadata.tags) formData.append('tags', metadata.tags);
    if (metadata.project_id) formData.append('project_id', metadata.project_id);
    if (metadata.capture) formData.append('capture', metadata.capture);
    if (metadata.triangle_count) formData.append('triangle_count', metadata.triangle_count);

    const xhr = new XMLHttpRequest();
    
    const promise = new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Réponse invalide'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || `Erreur ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Erreur ${xhr.status}`));
          }
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Erreur réseau')));
      xhr.addEventListener('abort', () => reject(new Error('Upload annulé')));
    });
    
    xhr.open('POST', `${API_BASE_URL}/assets/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
    xhr.send(formData);
    
    return promise;
  }

  /**
   * Upload en chunks (pour fichiers >= 100 MB)
   */
  async uploadChunks(file, onProgress, metadata) {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    this.uploadId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    this.abortController = new AbortController();
    
    let uploadedChunks = 0;
    let lastProgress = 0;
    
    // Envoyer d'abord les métadonnées
    try {
      const metadataResponse = await fetch(`${API_BASE_URL}/assets/upload-chunk/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          totalChunks: totalChunks,
          uploadId: this.uploadId,
          metadata: {
            title: metadata.title || file.name,
            description: metadata.description || '',
            visibility: metadata.visibility || 'private',
            categories: metadata.categories || '',
            tags: metadata.tags || '',
            project_id: metadata.project_id || '',
            triangle_count: metadata.triangle_count || ''
          }
        }),
        signal: this.abortController.signal
      });
      
      if (!metadataResponse.ok) {
        throw new Error('Erreur initialisation upload');
      }
    } catch (err) {
      throw new Error(`Erreur initialisation: ${err.message}`);
    }
    
    // Uploader chaque chunk séquentiellement
    for (let i = 0; i < totalChunks; i++) {
      if (this.abortController.signal.aborted) {
        await this.cancelUpload();
        throw new Error('Upload annulé');
      }
      
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', i);
      formData.append('uploadId', this.uploadId);
      
      try {
        const chunkResponse = await fetch(`${API_BASE_URL}/assets/upload-chunk`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          },
          body: formData,
          signal: this.abortController.signal
        });
        
        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json();
          throw new Error(errorData.error || `Erreur chunk ${i + 1}/${totalChunks}`);
        }
        
        uploadedChunks++;
        const progress = Math.round((uploadedChunks / totalChunks) * 95);
        
        // Mettre à jour la progression (avec des paliers pour éviter trop d'appels)
        if (progress - lastProgress >= 5 || progress === 95) {
          if (onProgress) onProgress(progress);
          lastProgress = progress;
        }
        
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error('Upload annulé');
        }
        throw new Error(`Erreur chunk ${i + 1}: ${err.message}`);
      }
    }
    
    // Finaliser l'upload
    try {
      if (onProgress) onProgress(98);
      
      const finalResponse = await fetch(`${API_BASE_URL}/assets/upload-chunk/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uploadId: this.uploadId
        }),
        signal: this.abortController.signal
      });
      
      if (!finalResponse.ok) {
        const errorData = await finalResponse.json();
        throw new Error(errorData.error || 'Erreur finalisation');
      }
      
      const result = await finalResponse.json();
      
      if (onProgress) onProgress(100);
      
      return result;
      
    } catch (err) {
      await this.cancelUpload();
      throw err;
    }
  }

  /**
   * Annuler un upload en cours
   */
  async cancelUpload() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    if (this.uploadId) {
      try {
        await fetch(`${API_BASE_URL}/assets/upload-chunk/cancel/${this.uploadId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      } catch (e) {
        console.error('Erreur annulation:', e);
      }
      this.uploadId = null;
    }
  }
}

export default UploadService;