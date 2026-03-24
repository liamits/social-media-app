import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { API } from '../../../utils/api';
import './Suggestions.css';

function Suggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API.users.suggestions, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSuggestions();
  }, [user]);

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(API.users.follow(userId), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setFollowing(prev => ({ ...prev, [userId]: !prev[userId] }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="suggestions">
      <div className="user-profile-summary">
        <div className="profile-avatar-large">
          <img src={user?.avatar} alt={user?.username} />
        </div>
        <div className="profile-info">
          <p className="username-main">{user?.username}</p>
          <p className="full-name">{user?.fullName}</p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <>
          <div className="suggestions-header">
            <span>Suggested for you</span>
          </div>
          <div className="suggestions-list">
            {suggestions.map(u => (
              <div key={u._id} className="suggestion-item">
                <div className="post-user">
                  <div className="post-avatar">
                    <img src={u.avatar} alt={u.username} />
                  </div>
                  <div className="post-user-info">
                    <Link to={`/profile/${u.username}`} className="post-username">{u.username}</Link>
                    <span className="post-location">{u.fullName}</span>
                  </div>
                </div>
                <button className="follow-link" onClick={() => handleFollow(u._id)}>
                  {following[u._id] ? 'Unfollow' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <footer className="suggestions-footer">
        <p>About • Help • Privacy • Terms</p>
        <p className="copyright">© 2026 Instagram</p>
      </footer>
    </div>
  );
}

export default Suggestions;
