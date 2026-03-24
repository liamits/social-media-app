import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { API } from '../../utils/api';
import './FollowListModal.css';

function FollowListModal({ userId, type, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('token');
        const url = type === 'followers' ? API.users.followers(userId) : API.users.following(userId);
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        console.log('[FollowListModal] url:', url, 'status:', res.status, 'json:', json);
        if (res.ok) setList(json.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [userId, type]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="follow-modal-overlay" onClick={onClose}>
      <div className="follow-modal" onClick={e => e.stopPropagation()}>
        <header className="follow-modal-header">
          <h3>{type === 'followers' ? 'Followers' : 'Following'}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </header>
        <div className="follow-modal-list">
          {loading ? (
            <p className="follow-loading">Loading...</p>
          ) : list.length === 0 ? (
            <p className="follow-empty">
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          ) : (
            list.map(u => (
              <Link
                key={u._id}
                to={`/profile/${u.username}`}
                className="follow-item"
                onClick={onClose}
              >
                <img src={u.avatar} alt={u.username} className="follow-avatar" />
                <div className="follow-info">
                  <span className="follow-username">{u.username}</span>
                  {u.fullName && <span className="follow-fullname">{u.fullName}</span>}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowListModal;
