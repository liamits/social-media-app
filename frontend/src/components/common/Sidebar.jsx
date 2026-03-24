import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Search, Compass, Tv, MessageCircle, Heart, PlusSquare, Menu, Instagram, X, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreatePostModal from '../../features/feed/components/CreatePostModal';
import './Sidebar.css';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', action: 'search' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: Tv, label: 'Reels' },
  { icon: MessageCircle, label: 'Messages' },
  { icon: Heart, label: 'Notifications' },
  { icon: PlusSquare, label: 'Create', action: 'create' },
  { icon: 'profile', label: 'Profile', path: '/profile' },
  { icon: LogOut, label: 'Logout', action: 'logout' },
];

function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handlePostSuccess = (newPost) => {
    console.log('Post created:', newPost);
    // You could trigger a feed refresh here
    window.location.reload(); // Simple way for now
  };

  return (
    <>
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo">
          <Instagram size={24} className="logo-icon" />
          <span className="logo-text">Instagram</span>
        </Link>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            
            const content = (
              <>
                {item.icon === 'profile' ? (
                  <div className="profile-avatar-mini">
                    <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" />
                  </div>
                ) : (
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                )}
                <span className="nav-label">{item.label}</span>
              </>
            );

            if (item.path) {
              return (
                <Link key={index} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                  {content}
                </Link>
              );
            }

            return (
              <button 
                key={index} 
                className="nav-item" 
                onClick={() => {
                  if (item.action === 'create') setShowCreateModal(true);
                  if (item.action === 'search') setShowSearch(!showSearch);
                  if (item.action === 'logout') logout();
                }}
              >
                {content}
              </button>
            );
          })}
        </nav>

      <div className="sidebar-footer">
        <button className="nav-item">
          <Menu size={24} />
          <span className="nav-label">More</span>
        </button>
      </div>
      </aside>

      <CreatePostModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSuccess={handlePostSuccess}
      />

      {showSearch && (
        <div className="search-sidebar" onClick={() => setShowSearch(false)}>
          <div className="search-panel" onClick={e => e.stopPropagation()}>
            <header className="search-header">
              <h2>Search</h2>
              <div className="search-input-container">
                <input type="text" placeholder="Search" autoFocus />
              </div>
            </header>
            <div className="search-results">
              <p className="no-results">No recent searches.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
