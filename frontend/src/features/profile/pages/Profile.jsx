import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Grid, Bookmark, UserSquare, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { API } from '../../../utils/api';
import EditProfileModal from '../components/EditProfileModal';
import PostModal from '../../../components/common/PostModal';
import FollowListModal from '../../../components/common/FollowListModal';
import './Profile.css';
import '../../explore/pages/Grid.css';

function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [followModal, setFollowModal] = useState(null); // 'followers' | 'following' | null

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API.users.profile(username));
        const json = await res.json();
        if (res.ok) {
          setProfileData(json.data);
          setPosts(json.data.posts || []);
          setIsFollowing(json.data.user.followers.includes(currentUser?.id));
        }
        // Fetch saved posts only for own profile
        if (currentUser?.username === username) {
          const savedRes = await fetch(API.posts.saved, { headers: { Authorization: `Bearer ${token}` } });
          const savedJson = await savedRes.json();
          if (savedRes.ok) setSavedPosts(savedJson.data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, currentUser?.id]);

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.users.follow(profileData.user._id), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setProfileData(prev => ({
          ...prev,
          followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1,
        }));
      }
    } catch (err) { console.error(err); }
  };

  const handleProfileUpdate = (updatedUser) => {
    setProfileData(prev => ({ ...prev, user: updatedUser }));
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.delete(postId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (!profileData) return <div className="profile-error">User not found</div>;

  const { user, postCount, followersCount, followingCount } = profileData;
  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar-xl">
          <img src={user.avatar} alt="Profile" />
        </div>
        <section className="profile-details">
          <div className="profile-top-row">
            <h2 className="profile-username">{user.username}</h2>
            {isOwnProfile ? (
              <>
                <button className="edit-profile-btn" onClick={() => setShowEditModal(true)}>Edit profile</button>
                <Settings size={20} className="settings-icon" />
              </>
            ) : (
              <div className="profile-actions">
                <button className={`follow-btn ${isFollowing ? 'unfollow' : ''}`} onClick={handleFollow}>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button className="msg-btn" onClick={() => navigate(`/messages?userId=${user._id}`)}>
                  Message
                </button>
              </div>
            )}
          </div>
          <div className="profile-stats">
            <span><strong>{postCount}</strong> posts</span>
            {isOwnProfile ? (
              <>
                <button className="profile-stat-btn" onClick={() => setFollowModal('followers')}>
                  <strong>{followersCount}</strong> followers
                </button>
                <button className="profile-stat-btn" onClick={() => setFollowModal('following')}>
                  <strong>{followingCount}</strong> following
                </button>
              </>
            ) : (
              <>
                <span><strong>{followersCount}</strong> followers</span>
                <span><strong>{followingCount}</strong> following</span>
              </>
            )}
          </div>
          <div className="profile-bio">
            <p className="full-name">{user.fullName || user.username}</p>
            <p className="bio-text">{user.bio}</p>
          </div>
        </section>
      </header>

      <div className="profile-tabs">
        <button className={`tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          <Grid size={12} /> POSTS
        </button>
        {isOwnProfile && (
          <button className={`tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
            <Bookmark size={12} /> SAVED
          </button>
        )}
        <button className={`tab ${activeTab === 'tagged' ? 'active' : ''}`} onClick={() => setActiveTab('tagged')}>
          <UserSquare size={12} /> TAGGED
        </button>
      </div>

      <div className="posts-grid">
        {(activeTab === 'posts' ? posts : activeTab === 'saved' ? savedPosts : []).map(post => (
          <div key={post._id} className="grid-item" onClick={() => setSelectedPost(post)}>
            <img src={post.image} alt="Post" />
            <div className="grid-overlay">
              <span>❤️ {post.likes?.length || 0}</span>
              <span>💬 {post.comments?.length || 0}</span>
            </div>
            {isOwnProfile && activeTab === 'posts' && (
              <button className="delete-post-grid-btn" onClick={() => handleDeletePost(post._id)}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {activeTab === 'posts' && posts.length === 0 && (
          <div className="no-posts-grid"><p>No posts yet.</p></div>
        )}
        {activeTab === 'saved' && savedPosts.length === 0 && (
          <div className="no-posts-grid"><p>No saved posts.</p></div>
        )}
      </div>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDelete={(id) => { setPosts(prev => prev.filter(p => p._id !== id)); setSelectedPost(null); }}
        />
      )}

      {followModal && (
        <FollowListModal
          userId={user._id}
          type={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}

export default Profile;
