import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, AtSign, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { API } from '../../../utils/api';
import TagSelector from '../../../components/common/TagSelector';
import './Post.css';

function Post({ post, onDelete, savedPostIds = [] }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.id));
  const [isSaved, setIsSaved] = useState(savedPostIds.includes(post._id));
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [commentTags, setCommentTags] = useState([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const menuRef = useRef();

  const isOwner = user?.id === post.user?._id?.toString() || user?.id === post.user?.id;

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();

  const handleDoubleTap = () => {
    if (!isLiked) toggleLike();
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

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
      setLikes(post.likes);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.comment(post._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText, tags: commentTags.map(t => t._id) }),
      });
      const json = await res.json();
      if (res.ok) { 
        setComments(json.data.comments); 
        setCommentText(''); 
        setCommentTags([]);
        setShowTagSelector(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.delete(post._id), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) onDelete?.(post._id);
    } catch (err) { console.error(err); }
    setShowMenu(false);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.deleteComment(post._id, commentId), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) { console.error(err); }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.likeComment(post._id, commentId), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setComments(prev => prev.map(c => 
          c._id === commentId ? { ...c, likes: json.data } : c
        ));
      }
    } catch (err) { console.error(err); }
  };

  const toggleSave = async () => {
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const token = localStorage.getItem('token');
      await fetch(API.posts.save(post._id), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      setIsSaved(prev);
    }
  };

  return (
    <article className="post">
      <header className="post-header">
        <div className="post-user">
          <div className="post-avatar">
            <img src={post.user.avatar} alt={post.user.username} />
          </div>
          <div className="post-user-info">
            <span className="post-username">{post.user.username}</span>
            {post.location && <span className="post-location">{post.location}</span>}
          </div>
        </div>
        {isOwner && (
          <div className="post-menu-wrapper" ref={menuRef}>
            <button className="post-more" onClick={() => setShowMenu(v => !v)}>
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <div className="post-menu">
                <button className="post-menu-item delete" onClick={handleDeletePost}>
                  <Trash2 size={16} /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="post-image" onDoubleClick={handleDoubleTap}>
        <img src={post.image} alt="Post content" />
        {showHeartAnim && <div className="heart-anim">❤️</div>}
      </div>

      <div className="post-actions">
        <div className="post-actions-left">
          <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={toggleLike} data-test-id="post-like-btn">
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button className="action-btn" data-test-id="post-comment-btn"><MessageCircle size={24} /></button>
          <button className="action-btn"><Send size={24} /></button>
        </div>
        <button className={`action-btn ${isSaved ? 'saved' : ''}`} onClick={toggleSave} data-test-id="post-save-btn">
          <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
        </button>      </div>

      <section className="post-details">
        <p className="post-likes">{likes.length.toLocaleString()} likes</p>
        <div className="post-caption">
          <span className="post-username">{post.user.username}</span> {post.caption}
          {post.tags?.length > 0 && (
            <div className="post-tags">
              {post.tags.map(tag => (
                <Link key={tag._id} to={`/profile/${tag.username}`} className="tag-link">
                  @{tag.username}
                </Link>
              ))}
            </div>
          )}
        </div>
        {comments.length > 0 && (
          <div className="post-comments-preview">
            {comments.slice(-2).map((comment) => (
              <div key={comment._id} className="comment-item">
                <span className="comment-username">{comment.user?.username || 'user'}</span> 
                {comment.text}
                {comment.tags?.length > 0 && (
                  <span className="comment-tags">
                    {comment.tags.map(tag => (
                      <Link key={tag._id} to={`/profile/${tag.username}`} className="tag-link">
                        @{tag.username}
                      </Link>
                    ))}
                  </span>
                )}
                <div className="comment-actions">
                  <button 
                    className={`comment-like-btn ${comment.likes?.includes(user?.id || user?._id) ? 'liked' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleCommentLike(comment._id); }}
                  >
                    <Heart size={12} fill={comment.likes?.includes(user?.id || user?._id) ? 'currentColor' : 'none'} />
                    {comment.likes?.length > 0 && <span>{comment.likes.length}</span>}
                  </button>
                  {(user?.id === comment.user?._id?.toString() || isOwner) && (
                    <button className="delete-comment-btn" onClick={() => handleDeleteComment(comment._id)}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {comments.length > 2 && (
              <button className="view-all-comments">View all {comments.length} comments</button>
            )}
          </div>
        )}
        <p className="post-time">{formatDate(post.createdAt)}</p>
      </section>

      <form className="post-comment-input" onSubmit={handleCommentSubmit}>
        {commentTags.length > 0 && (
          <div className="selected-comment-tags">
            {commentTags.map(tag => (
              <span key={tag._id} className="comment-tag-badge">
                @{tag.username}
                <button type="button" onClick={() => setCommentTags(prev => prev.filter(t => t._id !== tag._id))}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          data-test-id="post-comment-input"
        />
        <button 
          type="button" 
          className="comment-tag-btn" 
          onClick={() => setShowTagSelector(v => !v)}
          title="Tag friends"
        >
          <AtSign size={18} />
        </button>
        {showTagSelector && (
          <div className="comment-tag-panel">
            <TagSelector selectedTags={commentTags} onTagsChange={setCommentTags} />
            <button type="button" className="done-tag-btn" onClick={() => setShowTagSelector(false)}>Done</button>
          </div>
        )}
        <button type="submit" className="post-btn" disabled={!commentText.trim() && commentTags.length === 0} data-test-id="post-comment-submit-btn">Post</button>
      </form>
    </article>
  );
}

export default Post;
