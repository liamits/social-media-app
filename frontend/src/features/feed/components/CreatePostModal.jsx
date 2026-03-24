import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { API } from '../../../utils/api';
import './CreatePostModal.css';

function CreatePostModal({ isOpen, onClose, onSuccess }) {
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    setFile(dropped);
    setPreview(URL.createObjectURL(dropped));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // 1. Upload image to Cloudinary
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch(API.upload, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');

      // 2. Create post with image URL
      const postRes = await fetch(API.posts.base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: uploadData.url, caption, location }),
      });
      const postData = await postRes.json();
      if (!postRes.ok) throw new Error(postData.message || 'Failed to create post');

      onSuccess(postData);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreview('');
    setFile(null);
    setCaption('');
    setLocation('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <button className="close-modal" onClick={handleClose}><X size={24} color="white" /></button>
      <div className="create-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Create new post</h3>
          {preview && (
            <button className="share-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Sharing...' : 'Share'}
            </button>
          )}
        </header>

        <div className="modal-body">
          {!preview ? (
            <div
              className="upload-placeholder"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current.click()}
            >
              <ImageIcon size={48} strokeWidth={1} />
              <p>Drag & drop or click to select photo</p>
              <button className="select-btn" type="button">Select from computer</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="post-creation-container">
              <div className="image-preview">
                <img src={preview} alt="Preview" />
              </div>
              <div className="post-details">
                <textarea
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  maxLength={2200}
                />
                <input
                  type="text"
                  placeholder="Add location"
                  className="location-input"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
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
