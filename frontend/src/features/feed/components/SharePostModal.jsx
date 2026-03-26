import React, { useState, useEffect } from 'react';
import { X, Search, Send } from 'lucide-react';
import { API } from '../../../utils/api';
import './SharePostModal.css';

function SharePostModal({ post, isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedUsers([]);
      return;
    }
    fetchInitialUsers();
  }, [isOpen]);

  const fetchInitialUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Default to following list or suggestions
      const res = await fetch(API.users.suggestions, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setUsers(json.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      if (isOpen) fetchInitialUsers();
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(API.users.search(searchTerm));
        const json = await res.json();
        if (res.ok) setUsers(json.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, isOpen]);

  const toggleSelectUser = (user) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const promises = selectedUsers.map(user => 
        fetch(API.messages.send(user._id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ 
            type: 'post', 
            postId: post._id 
          }),
        })
      );
      await Promise.all(promises);
      onClose();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <header className="share-header">
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
          <h3>Share</h3>
          <button 
            className="share-submit-btn" 
            disabled={selectedUsers.length === 0 || sending}
            onClick={handleShare}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </header>

        <div className="share-search-bar">
          <span className="to-label">To:</span>
          <div className="selected-tags-inline">
            {selectedUsers.map(u => (
              <span key={u._id} className="selected-tag">
                {u.username}
                <button onClick={() => toggleSelectUser(u)}><X size={12} /></button>
              </span>
            ))}
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="share-user-list">
          {loading ? (
            <p className="share-loading">Searching...</p>
          ) : users.length > 0 ? (
            users.map(user => (
              <div 
                key={user._id} 
                className={`share-user-item ${selectedUsers.find(u => u._id === user._id) ? 'selected' : ''}`}
                onClick={() => toggleSelectUser(user)}
              >
                <img src={user.avatar} alt={user.username} className="share-user-avatar" />
                <div className="share-user-info">
                  <span className="share-username">{user.username}</span>
                  <span className="share-fullname">{user.fullName}</span>
                </div>
                <div className="share-checkbox">
                  <div className={`checkbox-circle ${selectedUsers.find(u => u._id === user._id) ? 'checked' : ''}`} />
                </div>
              </div>
            ))
          ) : (
            <p className="no-results">No account found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharePostModal;
