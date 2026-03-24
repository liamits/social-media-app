import React, { useState } from 'react';
import { X } from 'lucide-react';
import './EditProfileModal.css';

function EditProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, bio, avatar })
      });

      const data = await response.json();
      if (response.ok) {
        onUpdate(data.user);
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update profile');
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
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)}
              placeholder="Full Name"
            />
          </div>

          <div className="form-group">
            <label>Avatar URL</label>
            <input 
              type="text" 
              value={avatar} 
              onChange={e => setAvatar(e.target.value)}
              placeholder="Image URL"
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)}
              placeholder="Bio"
              maxLength={150}
            />
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
