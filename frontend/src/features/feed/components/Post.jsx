import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, AtSign, X, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { API } from '../../../utils/api';
import TagSelector from '../../../components/common/TagSelector';
import EditPostModal from './EditPostModal';
import SharePostModal from './SharePostModal';
import './Post.css';

function Post({ post: initialPost, onDelete, savedPostIds = [] }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.id));
  const [isSaved, setIsSaved] = useState(savedPostIds.includes(post._id));
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [commentTags, setCommentTags] = useState([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const menuRef = useRef();
  const inputRef = useRef();

  const images = post.images?.length > 0 ? post.images : [post.image];

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : prev));
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const isOwner = user?.id === post.user?._id?.toString() || user?.id === post.user?.id;

  useEffect(() => {
    const handler = (e) => { 
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false); 
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleEditSuccess = (updatedPost) => {
    setPost(updatedPost);
    setShowMenu(false);
  };

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

  const handleReply = (comment) => {
    setReplyTo({ id: comment._id, username: comment.user.username });
    setCommentText(`@${comment.user.username} `);
    inputRef.current?.focus();
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.posts.comment(post._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          text: commentText, 
          tags: commentTags.map(t => t._id),
          parentId: replyTo?.id
        }),
      });
      const json = await res.json();
      if (res.ok) { 
        setComments(json.data.comments); 
        setCommentText(''); 
        setCommentTags([]);
        setReplyTo(null);
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

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);

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
                <button className="post-menu-item" onClick={() => setIsEditModalOpen(true)}>
                  <Edit2 size={16} /> Edit post
                </button>
                <button className="post-menu-item delete" onClick={handleDeletePost}>
                  <Trash2 size={16} /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="post-image-container" onDoubleClick={handleDoubleTap}>
        <div className="post-carousel" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
          {images.map((src, i) => (
            <div key={i} className="carousel-slide">
              <img src={src} alt={`Post content ${i + 1}`} />
            </div>
          ))}
        </div>
        
        {images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <button className="carousel-nav prev" onClick={prevImage}>
                <ChevronLeft size={20} />
              </button>
            )}
            {currentImageIndex < images.length - 1 && (
              <button className="carousel-nav next" onClick={nextImage}>
                <ChevronRight size={20} />
              </button>
            )}
            <div className="carousel-indicators">
              {images.map((_, i) => (
                <span key={i} className={`indicator-dot ${i === currentImageIndex ? 'active' : ''}`} />
              ))}
            </div>
          </>
        )}
        {showHeartAnim && <div className="heart-anim">❤️</div>}
      </div>

      <div className="post-actions">
        <div className="post-actions-left">
          <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={toggleLike} data-test-id="post-like-btn">
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button className="action-btn" data-test-id="post-comment-btn" onClick={() => inputRef.current?.focus()}>
            <MessageCircle size={24} />
          </button>
          <button className="action-btn" onClick={() => setIsShareModalOpen(true)}>
            <Send size={24} />
          </button>
        </div>
        <button className={`action-btn ${isSaved ? 'saved' : ''}`} onClick={toggleSave} data-test-id="post-save-btn">
          <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
        </button>      
      </div>

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
        
        <div className="post-comments-preview">
          {rootComments.slice(-3).map((comment) => (
            <div key={comment._id} className="comment-group">
              <div className="comment-item">
                <span className="comment-username">{comment.user?.username || 'user'}</span> 
                {comment.text}
                <div className="comment-actions">
                  <button 
                    className={`comment-mini-btn ${comment.likes?.includes(user?.id) ? 'liked' : ''}`}
                    onClick={() => handleCommentLike(comment._id)}
                  >
                    <Heart size={12} fill={comment.likes?.includes(user?.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button className="comment-mini-btn reply" onClick={() => handleReply(comment)}>Reply</button>
                  {(user?.id === comment.user?._id?.toString() || isOwner) && (
                    <button className="comment-mini-btn delete" onClick={() => handleDeleteComment(comment._id)}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              {getReplies(comment._id).map(reply => (
                <div key={reply._id} className="comment-item reply">
                  <span className="comment-username">{reply.user?.username}</span>
                  {reply.text}
                  <div className="comment-actions">
                    <button 
                      className={`comment-mini-btn ${reply.likes?.includes(user?.id) ? 'liked' : ''}`}
                      onClick={() => handleCommentLike(reply._id)}
                    >
                      <Heart size={12} fill={reply.likes?.includes(user?.id) ? 'currentColor' : 'none'} />
                    </button>
                    {(user?.id === reply.user?._id?.toString() || isOwner) && (
                      <button className="comment-mini-btn delete" onClick={() => handleDeleteComment(reply._id)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {rootComments.length > 3 && (
            <button className="view-all-comments">View all {comments.length} comments</button>
          )}
        </div>
        <p className="post-time">{formatDate(post.createdAt)}</p>
      </section>

      <form className="post-comment-input" onSubmit={handleCommentSubmit}>
        {replyTo && (
          <div className="reply-indicator">
            Replying to @{replyTo.username}
            <button type="button" onClick={() => setReplyTo(null)}><X size={12} /></button>
          </div>
        )}
        <div className="comment-input-row">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <button type="submit" className="post-btn" disabled={!commentText.trim()}>Post</button>
        </div>
      </form>

      <EditPostModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        post={post} 
        onSuccess={handleEditSuccess} 
      />
      <SharePostModal 
        post={post} 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </article>
  );
}

export default Post;
