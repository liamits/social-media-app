import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import './Post.css';

function Post({ post }) {
  const [isLiked, setIsLiked] = useState(false);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options).toUpperCase();
  };

  return (
    <article className="post">
      <header className="post-header">
        <div className="post-user">
          <div className="post-avatar">
            <img src={post.user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt={post.user.username} />
          </div>
          <div className="post-user-info">
            <span className="post-username">{post.user.username}</span>
            {post.location && <span className="post-location">{post.location}</span>}
          </div>
        </div>
        <button className="post-more">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <div className="post-image" onDoubleClick={() => setIsLiked(true)}>
        <img src={post.image} alt="Post content" />
      </div>

      <div className="post-actions">
        <div className="post-actions-left">
          <button 
            className={`action-btn ${isLiked ? 'liked animate-heart' : ''}`} 
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button className="action-btn">
            <MessageCircle size={24} />
          </button>
          <button className="action-btn">
            <Send size={24} />
          </button>
        </div>
        <button className="action-btn">
          <Bookmark size={24} />
        </button>
      </div>

      <section className="post-details">
        <p className="post-likes">{(post.likes?.length || 0).toLocaleString()} likes</p>
        <div className="post-caption">
          <span className="post-username">{post.user.username}</span> {post.caption}
        </div>
        <p className="post-time">{formatDate(post.createdAt)}</p>
      </section>

      <div className="post-comment-input">
        <input type="text" placeholder="Add a comment..." />
        <button className="post-btn">Post</button>
      </div>
    </article>
  );
}

export default Post;
