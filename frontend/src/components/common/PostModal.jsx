import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, Bookmark, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API } from '../../utils/api';
import EmojiPickerBtn from './EmojiPickerBtn';
import './PostModal.css';

function PostModal({ post: initialPost, onClose, onDelete }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [likes, setLikes] = useState(initialPost.likes || []);
  const [comments, setComments] = useState(initialPost.comments || []);
  const [isLiked, setIsLiked] = useState(initialPost.likes?.includes(user?.id));
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isOwner = user?.id === post.user?._id?.toString() || user?.id === post.user?.id;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Check saved state
  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API.posts.saved, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (res.ok) setIsSaved(json.data.some(p => p._id === post._id));
      } catch {}
    };
    fetchSaved();
  }, [post._id]);

  const toggleLike = async () => {
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikes(prev => wasLiked ? prev.filter(id => id !== user.id) : [...prev, user.id]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.like(post._id), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(wasLiked);
      setLikes(initialPost.likes);
    }
  };

  const toggleSave = async () => {
    setIsSaved(p => !p);
    try {
      const token = localStorage.getItem('token');
      await fetch(API.posts.save(post._id), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    } catch { setIsSaved(p => !p); }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.comment(post._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText }),
      });
      const json = await res.json();
      if (res.ok) { setComments(json.data.comments); setCommentText(''); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.deleteComment(post._id, commentId), {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.delete(post._id), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { onDelete?.(post._id); onClose(); }
    } catch (err) { console.error(err); }
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <button className="post-modal-close" onClick={onClose}><X size={28} color="white" /></button>
      <div className="post-modal-inner" onClick={e => e.stopPropagation()}>

        {/* Left: image */}
        <div className="post-modal-image" onDoubleClick={toggleLike}>
          <img src={post.image} alt="post" />
        </div>

        {/* Right: details */}
        <div className="post-modal-right">
          {/* Header */}
          <div className="post-modal-header">
            <Link to={`/profile/${post.user.username}`} className="post-modal-user" onClick={onClose}>
              <img src={post.user.avatar} alt={post.user.username} className="post-modal-avatar" />
              <div>
                <span className="post-modal-username">{post.user.username}</span>
                {post.location && <span className="post-modal-location">{post.location}</span>}
              </div>
            </Link>
            {isOwner && (
              <button className="post-modal-delete-btn" onClick={handleDeletePost} title="Delete post">
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {/* Caption */}
          {post.caption && (
            <div className="post-modal-caption">
              <img src={post.user.avatar} alt="" className="post-modal-avatar-sm" />
              <div>
                <span className="post-modal-username">{post.user.username}</span>
                {' '}{post.caption}
                <p className="post-modal-time">{timeAgo(post.createdAt)}</p>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="post-modal-comments">
            {comments.map(c => (
              <div key={c._id} className="post-modal-comment">
                <img src={c.user?.avatar} alt={c.user?.username} className="post-modal-avatar-sm" />
                <div className="comment-body">
                  <span className="post-modal-username">{c.user?.username}</span>
                  {' '}{c.text}
                  <p className="post-modal-time">{timeAgo(c.createdAt)}</p>
                </div>
                {(user?.id === c.user?._id?.toString() || isOwner) && (
                  <button className="delete-comment-btn" onClick={() => handleDeleteComment(c._id)}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="post-modal-actions">
            <div className="post-modal-actions-left">
              <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={toggleLike}>
                <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>
            <button className={`action-btn ${isSaved ? 'saved' : ''}`} onClick={toggleSave}>
              <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
          <p className="post-modal-likes">{likes.length.toLocaleString()} likes</p>

          {/* Comment input */}
          <form className="post-modal-comment-form" onSubmit={handleCommentSubmit}>
            <EmojiPickerBtn onEmojiSelect={(emoji) => setCommentText(prev => prev + emoji)} />
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            <button type="submit" disabled={!commentText.trim()}>Post</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PostModal;
