import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Compass, Tv, MessageCircle, Heart, PlusSquare, Menu, Instagram, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { API } from '../../utils/api';
import CreatePostModal from '../../features/feed/components/CreatePostModal';
import './Sidebar.css';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', action: 'search' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: Tv, label: 'Reels' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Heart, label: 'Notifications', path: '/notifications' },
  { icon: PlusSquare, label: 'Create', action: 'create' },
  { icon: 'profile', label: 'Profile', path: '/profile' },
  { icon: LogOut, label: 'Logout', action: 'logout' },
];

function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { onlineUsers, socket } = useSocket();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API.notifications.unreadCount, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (res.ok) setUnreadCount(json.data.count);
      } catch (err) {}
    };
    fetchUnread();
  }, []);

  // Real-time new notification
  useEffect(() => {
    if (!socket) return;
    const handler = () => setUnreadCount(prev => prev + 1);
    socket.on('newNotification', handler);
    return () => socket.off('newNotification', handler);
  }, [socket]);

  // Real-time new message badge
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      if (location.pathname !== '/messages') setUnreadMsgCount(prev => prev + 1);
    };
    socket.on('newMessage', handler);
    return () => socket.off('newMessage', handler);
  }, [socket, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/notifications') setUnreadCount(0);
    if (location.pathname === '/messages') setUnreadMsgCount(0);
  }, [location.pathname]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const response = await fetch(API.users.search(searchQuery));
          const json = await response.json();
          setSearchResults(json.data || []);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handlePostSuccess = (newPost) => {
    console.log('Post created:', newPost);
    window.location.reload(); 
  };

  return (
    <>
      <aside className={`sidebar ${showSearch ? 'collapsed' : ''}`}>
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
                  <div className="profile-avatar-mini-wrapper" data-test-id="sidebar-profile-link">
                    <div className="profile-avatar-mini">
                      <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" />
                    </div>
                    {onlineUsers.includes((user?.id || user?._id)?.toString()) && (
                      <div className="sidebar-online-dot" />
                    )}
                  </div>
                ) : item.label === 'Notifications' ? (
                  <div className="nav-icon-wrapper" data-test-id="sidebar-notifications-link">
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </div>
                ) : item.label === 'Messages' ? (
                  <div className="nav-icon-wrapper" data-test-id="sidebar-messages-link">
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                    {unreadMsgCount > 0 && <span className="notif-badge">{unreadMsgCount > 9 ? '9+' : unreadMsgCount}</span>}
                  </div>
                ) : (
                  <div data-test-id={`sidebar-${item.label?.toLowerCase()}-link`}>
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                  </div>
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
        <div className="search-sidebar" onClick={() => {
          setShowSearch(false);
          setSearchQuery('');
          setSearchResults([]);
        }}>
          <div className="search-panel" onClick={e => e.stopPropagation()}>
            <header className="search-header">
              <h2>Search</h2>
              <div className="search-input-container">
                <input 
                  type="text" 
                  placeholder="Search" 
                  autoFocus 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                   <button className="clear-search" onClick={() => setSearchQuery('')}>
                     <X size={14} fill="gray" />
                   </button>
                )}
              </div>
            </header>
            <div className="search-results">
              {isSearching ? (
                <p className="searching-text">Searching...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map(result => (
                  <Link 
                    key={result._id} 
                    to={`/profile/${result.username}`} 
                    className="search-result-item"
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                  >
                    <img src={result.avatar} alt={result.username} className="search-avatar" />
                    <div className="search-info">
                      <span className="search-username">{result.username}</span>
                      <span className="search-fullname">{result.fullName}</span>
                    </div>
                  </Link>
                ))
              ) : searchQuery ? (
                <p className="no-results">No results found.</p>
              ) : (
                <p className="no-results">No recent searches.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
