import React, { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { API } from '../../../utils/api';
import './EditProfileModal.css';

function EditProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      let avatarUrl = user.avatar;

      // Upload new avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('image', avatarFile);
        const uploadRes = await fetch(API.upload, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');
        avatarUrl = uploadData.url;
      }

      const response = await fetch(API.users.update, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName, bio, avatar: avatarUrl }),
      });

      const data = await response.json();
      if (response.ok) {
        onUpdate(data.user);
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <header className="edit-modal-header">
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
          <h2>Edit profile</h2>
          <div className="placeholder-side"></div>
        </header>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="avatar-upload-section">
            <div className="avatar-preview-wrapper" onClick={() => fileInputRef.current.click()}>
              <img src={avatarPreview} alt="avatar" className="avatar-preview" />
              <div className="avatar-overlay"><Camera size={20} /></div>
            </div>
            <button type="button" className="change-photo-btn" onClick={() => fileInputRef.current.click()}>
              Change photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          <div className="form-group">
            <label>Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" maxLength={150} />
            <span className="char-count">{bio.length}/150</span>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
