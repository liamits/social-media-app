import React from 'react';
import { Settings, Grid, Bookmark, UserSquare } from 'lucide-react';
import './Profile.css';
import '../../explore/pages/Grid.css';

const profilePosts = [
  { id: 1, url: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=800&auto=format&fit=crop' },
  { id: 2, url: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=800&auto=format&fit=crop' },
  { id: 3, url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop' },
  { id: 4, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' },
  { id: 5, url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800&auto=format&fit=crop' },
  { id: 6, url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop' },
];

function Profile() {
  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar-xl">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" />
        </div>
        
        <section className="profile-details">
          <div className="profile-top-row">
            <h2 className="profile-username">your_username</h2>
            <button className="edit-profile-btn">Edit profile</button>
            <Settings size={20} className="settings-icon" />
          </div>

          <div className="profile-stats">
            <span><strong>24</strong> posts</span>
            <span><strong>1.5k</strong> followers</span>
            <span><strong>450</strong> following</span>
          </div>

          <div className="profile-bio">
            <p className="full-name">Felix The Coder</p>
            <p className="bio-text">Building the future of social media UI. 🚀 #react #design #code</p>
          </div>
        </section>
      </header>

      <div className="profile-tabs">
        <button className="tab active"><Grid size={12} /> POSTS</button>
        <button className="tab"><Bookmark size={12} /> SAVED</button>
        <button className="tab"><UserSquare size={12} /> TAGGED</button>
      </div>

      <div className="posts-grid">
        {profilePosts.map(post => (
          <div key={post.id} className="grid-item">
            <img src={post.url} alt="Post" />
            <div className="grid-overlay">
              <span>❤️ 856</span>
              <span>💬 12</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;
