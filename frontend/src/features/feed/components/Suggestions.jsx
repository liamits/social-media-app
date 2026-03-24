import React from 'react';
import './Suggestions.css';

const suggestedUsers = [
  { id: 1, username: 'photography_hub', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Photo', status: 'Followed by art_gallery' },
  { id: 2, username: 'chef_master', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chef', status: 'New to Instagram' },
  { id: 3, username: 'global_news', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=News', status: 'Followed by tech_explorer' },
  { id: 4, username: 'music_lover', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Music', status: 'Suggested for you' },
];

function Suggestions() {
  return (
    <div className="suggestions">
      <div className="user-profile-summary">
        <div className="profile-avatar-large">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
        <div className="profile-info">
          <p className="username-main">your_username</p>
          <p className="full-name">Felix The Coder</p>
        </div>
        <button className="switch-btn">Switch</button>
      </div>

      <div className="suggestions-header">
        <span>Suggested for you</span>
        <button className="see-all-btn">See All</button>
      </div>

      <div className="suggestions-list">
        {suggestedUsers.map(user => (
          <div key={user.id} className="suggestion-item">
            <div className="post-user">
              <div className="post-avatar">
                <img src={user.avatar} alt={user.username} />
              </div>
              <div className="post-user-info">
                <span className="post-username">{user.username}</span>
                <span className="post-location">{user.status}</span>
              </div>
            </div>
            <button className="follow-link">Follow</button>
          </div>
        ))}
      </div>

      <footer className="suggestions-footer">
        <p>About • Help • Press • API • Jobs • Privacy • Terms • Locations • Language • Meta Verified</p>
        <p className="copyright">© 2026 INSTAGRAM FROM META</p>
      </footer>
    </div>
  );
}

export default Suggestions;
