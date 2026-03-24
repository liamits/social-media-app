import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Settings, Grid, Bookmark, UserSquare } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import './Profile.css';
import '../../explore/pages/Grid.css';

function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
// ... existing fetch logic ...
  }, [username, currentUser?.id]);

  const handleFollow = async () => {
// ... existing follow logic ...
  };

  const handleProfileUpdate = (updatedUser) => {
    setProfileData(prev => ({
      ...prev,
      user: updatedUser
    }));
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (!profileData) return <div className="profile-error">User not found</div>;

  const { user, posts, postCount, followersCount, followingCount } = profileData;
  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar-xl">
          <img src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Default"} alt="Profile" />
        </div>
        
        <section className="profile-details">
          <div className="profile-top-row">
            <h2 className="profile-username">{user.username}</h2>
            {isOwnProfile ? (
              <>
                <button 
                  className="edit-profile-btn"
                  onClick={() => setShowEditModal(true)}
                >
                  Edit profile
                </button>
                <Settings size={20} className="settings-icon" />
              </>
            ) : (
// ... existing follow button ...
            )}
          </div>
// ... existing stats and bio ...
        </section>
      </header>

// ... existing tabs and grid ...

      <EditProfileModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}

      <div className="profile-tabs">
        <button className="tab active"><Grid size={12} /> POSTS</button>
        <button className="tab"><Bookmark size={12} /> SAVED</button>
        <button className="tab"><UserSquare size={12} /> TAGGED</button>
      </div>

      <div className="posts-grid">
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post._id} className="grid-item">
              <img src={post.image} alt="Post" />
              <div className="grid-overlay">
                <span>❤️ {post.likes?.length || 0}</span>
                <span>💬 {post.comments?.length || 0}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-posts-grid">
            <p>No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
