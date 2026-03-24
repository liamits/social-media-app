import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import './CreatePostModal.css';

function CreatePostModal({ isOpen, onClose, onSuccess }) {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: imageUrl, caption, location })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create post');

      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <button className="close-modal" onClick={onClose}><X size={24} color="white" /></button>
      <div className="create-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Create new post</h3>
          {imageUrl && (
            <button 
              className="share-btn" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          )}
        </header>
        
        <div className="modal-body">
          {!imageUrl ? (
            <div className="upload-placeholder">
              <ImageIcon size={48} strokeWidth={1} />
              <p>Enter an image URL to start</p>
              <input 
                type="text" 
                placeholder="https://example.com/image.jpg"
                className="url-input"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="post-creation-container">
              <div className="image-preview">
                <img src={imageUrl} alt="Preview" onError={() => {
                  setError('Invalid image URL');
                  setImageUrl('');
                }} />
              </div>
              <div className="post-details">
                <div className="user-info-mini">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="avatar-small" />
                  <span className="username-small">you</span>
                </div>
                <textarea 
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                ></textarea>
                <input 
                  type="text" 
                  placeholder="Add location"
                  className="location-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                {error && <p className="error-text">{error}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreatePostModal;
