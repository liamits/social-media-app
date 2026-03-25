import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import { API } from '../../../utils/api';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API.notifications.base, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (res.ok) setNotifications(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();

    // Mark all as read
    const token = localStorage.getItem('token');
    fetch(API.notifications.readAll, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  }, []);

  const getIcon = (type) => {
    if (type === 'like') return <Heart size={18} fill="red" color="red" />;
    if (type === 'comment') return <MessageCircle size={18} color="#0095f6" />;
    return <UserPlus size={18} color="#2ecc71" />;
  };

  const getText = (notif) => {
    if (notif.type === 'like') return 'liked your post';
    if (notif.type === 'comment') return `commented: "${notif.text}"`;
    return 'started following you';
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  if (loading) return <div className="notif-loading">Loading...</div>;

  return (
    <div className="notifications-page">
      <h2 className="notif-title">Notifications</h2>
      {notifications.length === 0 ? (
        <p className="notif-empty">No notifications yet.</p>
      ) : (
        <div className="notif-list">
          {notifications.map(notif => (
            <div key={notif._id} className={`notif-item ${!notif.read ? 'unread' : ''}`} data-test-id="notif-item">
              <Link to={`/profile/${notif.sender?.username}`}>
                <img src={notif.sender?.avatar} alt={notif.sender?.username} className="notif-avatar" />
              </Link>
              <div className="notif-body">
                <p>
                  <Link to={`/profile/${notif.sender?.username}`} className="notif-username">
                    {notif.sender?.username}
                  </Link>
                  {' '}{getText(notif)}
                </p>
                <span className="notif-time">{timeAgo(notif.createdAt)}</span>
              </div>
              <div className="notif-icon">{getIcon(notif.type)}</div>
              {notif.post?.image && (
                <img src={notif.post.image} alt="post" className="notif-post-thumb" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
