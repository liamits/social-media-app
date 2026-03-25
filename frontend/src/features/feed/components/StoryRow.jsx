import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Eye, Trash2, Type, Check, AtSign, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { API } from '../../../utils/api';
import TagSelector from '../../../components/common/TagSelector';
import './StoryRow.css';

const TEXT_COLORS = ['#ffffff', '#000000', '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#af52de'];

function StoryRow() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [progress, setProgress] = useState(0);

  // Story creator state
  const [creatorStep, setCreatorStep] = useState(null); // null | 'editor' | 'uploading'
  const [storyFile, setStoryFile] = useState(null);
  const [storyPreview, setStoryPreview] = useState('');
  const [storyText, setStoryText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(24);
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tags, setTags] = useState([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const editorRef = useRef();

  const fileInputRef = useRef();
  const timerRef = useRef();

  useEffect(() => { fetchStories(); }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.stories.base, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setGroups(json.data);
    } catch (err) { console.error(err); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStoryFile(file);
    setStoryPreview(URL.createObjectURL(file));
    setStoryText('');
    setTextPos({ x: 50, y: 50 });
    setCreatorStep('editor');
    e.target.value = '';
  };

  const handlePublish = async () => {
    if (!storyFile) return;
    setCreatorStep('uploading');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', storyFile);
      const uploadRes = await fetch(API.upload, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const uploadJson = await uploadRes.json();
      const url = uploadJson.data?.url;

      await fetch(API.stories.base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          image: url,
          text: storyText,
          textStyle: { color: textColor, fontSize, position: textPos },
          tags: tags.map(t => t._id),
        }),
      });
      fetchStories();
    } catch (err) { console.error(err); }
    setCreatorStep(null);
    setStoryFile(null);
    setStoryPreview('');
    setStoryText('');
    setTags([]);
    setShowTagSelector(false);
  };

  // Drag text label
  const handleTextMouseDown = (e) => {
    e.preventDefault();
    const rect = editorRef.current.getBoundingClientRect();
    const labelX = (textPos.x / 100) * rect.width;
    const labelY = (textPos.y / 100) * rect.height;
    setDragOffset({ x: e.clientX - rect.left - labelX, y: e.clientY - rect.top - labelY });
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const rect = editorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.min(100, Math.max(0, ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100));
      setTextPos({ x, y });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, dragOffset]);

  // Viewer logic
  const openStory = (group, index = 0) => {
    setViewing({ group, index });
    setProgress(0);
    markViewed(group.stories[index]._id);
  };

  const markViewed = async (storyId) => {
    const token = localStorage.getItem('token');
    await fetch(API.stories.view(storyId), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  };

  const handleStoryLike = async (storyId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.stories.like(storyId), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setGroups(prev => prev.map(g => ({
          ...g,
          stories: g.stories.map(s => s._id === storyId ? { ...s, likes: json.data } : s)
        })));
      }
    } catch (err) { console.error(err); }
  };

  const nextStory = () => {
    if (!viewing) return;
    const { group, index } = viewing;
    if (index + 1 < group.stories.length) {
      const next = index + 1;
      setViewing({ group, index: next });
      setProgress(0);
      markViewed(group.stories[next]._id);
    } else {
      const gi = groups.findIndex(g => g.user._id === group.user._id);
      if (gi + 1 < groups.length) openStory(groups[gi + 1]);
      else closeStory();
    }
  };

  const prevStory = () => {
    if (!viewing) return;
    const { group, index } = viewing;
    if (index > 0) { setViewing({ group, index: index - 1 }); setProgress(0); }
  };

  const closeStory = () => {
    setViewing(null);
    setShowViewers(false);
    setViewers([]);
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (!viewing) return;
    clearInterval(timerRef.current);
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(timerRef.current); nextStory(); return 0; }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [viewing]);

  const fetchViewers = async (storyId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.stories.viewers(storyId), { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) { setViewers(json.data); setShowViewers(true); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (storyId) => {
    const token = localStorage.getItem('token');
    await fetch(API.stories.delete(storyId), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    closeStory();
    fetchStories();
  };

  const currentStory = viewing ? viewing.group.stories[viewing.index] : null;
  const isOwner = currentStory && currentStory.user?._id === user?.id;

  return (
    <>
      <div className="story-row">
        <div className="story-item" onClick={() => fileInputRef.current.click()}>
          <div className="story-avatar-container user">
            <div className="story-avatar">
              <img src={user?.avatar} alt="you" />
            </div>
            <div className="add-story-badge"><Plus size={10} /></div>
          </div>
          <span className="story-username">Your story</span>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
        </div>

        {groups.map(group => {
          const hasUnviewed = group.stories.some(s => !s.viewers.includes(user?.id));
          return (
            <div key={group.user._id} className="story-item" onClick={() => openStory(group)}>
              <div className={`story-avatar-container ${hasUnviewed ? 'unread' : 'seen'}`}>
                <div className="story-avatar">
                  <img src={group.user.avatar} alt={group.user.username} />
                </div>
              </div>
              <span className="story-username">{group.user.username}</span>
            </div>
          );
        })}
      </div>

      {/* Story Creator */}
      {creatorStep === 'editor' && (
        <div className="story-modal">
          <div className="story-creator-inner" ref={editorRef}>
            <img src={storyPreview} alt="story preview" className="story-img" />

            {/* Draggable text overlay */}
            {storyText ? (
              <div
                className="story-text-overlay"
                style={{ left: `${textPos.x}%`, top: `${textPos.y}%`, color: textColor, fontSize: `${fontSize}px` }}
                onMouseDown={handleTextMouseDown}
              >
                {storyText}
              </div>
            ) : null}

            {/* Top toolbar */}
            <div className="story-creator-toolbar">
              <button className="creator-btn" onClick={() => { setCreatorStep(null); setStoryPreview(''); }}>
                <X size={24} color="white" />
              </button>
              <div className="creator-toolbar-right">
                <button className="creator-btn" onClick={() => setShowTextInput(v => !v)} title="Add text">
                  <Type size={22} color="white" />
                </button>
                <button className="creator-btn" onClick={() => setShowTagSelector(v => !v)} title="Tag friends">
                  <AtSign size={22} color="white" />
                </button>
              </div>
            </div>

            {/* Text input panel */}
            {showTextInput && (
              <div className="story-text-panel" onClick={e => e.stopPropagation()}>
                <input
                  className="story-text-input"
                  placeholder="Type something..."
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                  maxLength={150}
                  autoFocus
                />
                <div className="text-style-row">
                  <div className="color-swatches">
                    {TEXT_COLORS.map(c => (
                      <button
                        key={c}
                        className={`color-swatch ${textColor === c ? 'active' : ''}`}
                        style={{ background: c }}
                        onClick={() => setTextColor(c)}
                      />
                    ))}
                  </div>
                  <div className="font-size-row">
                    <button onClick={() => setFontSize(s => Math.max(12, s - 4))}>A-</button>
                    <span>{fontSize}px</span>
                    <button onClick={() => setFontSize(s => Math.min(60, s + 4))}>A+</button>
                  </div>
                </div>
                <button className="done-text-btn" onClick={() => setShowTextInput(false)}>
                  <Check size={16} /> Done
                </button>
              </div>
            )}

            {/* Tag selector panel */}
            {showTagSelector && (
              <div className="story-tag-panel" onClick={e => e.stopPropagation()}>
                <TagSelector selectedTags={tags} onTagsChange={setTags} />
                <button className="done-text-btn" onClick={() => setShowTagSelector(false)}>
                  <Check size={16} /> Done
                </button>
              </div>
            )}

            {/* Render selected tags as badges in editor */}
            {tags.length > 0 && !showTagSelector && (
              <div className="story-editor-tags">
                {tags.map(tag => (
                  <span key={tag._id} className="story-tag-badge">
                    @{tag.username}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t._id !== tag._id))}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Publish button */}
            <button className="story-publish-btn" onClick={handlePublish}>
              Share story
            </button>
          </div>
        </div>
      )}

      {creatorStep === 'uploading' && (
        <div className="story-modal">
          <div className="story-uploading">
            <div className="uploading-spinner" />
            <p>Sharing story...</p>
          </div>
        </div>
      )}

      {/* Story viewer modal */}
      {viewing && currentStory && (
        <div className="story-modal" onClick={closeStory}>
          <div className="story-modal-inner" onClick={e => e.stopPropagation()}>
            <div className="story-progress-bars">
              {viewing.group.stories.map((_, i) => (
                <div key={i} className="story-progress-track">
                  <div className="story-progress-fill" style={{
                    width: i < viewing.index ? '100%' : i === viewing.index ? `${progress}%` : '0%'
                  }} />
                </div>
              ))}
            </div>

            <div className="story-header">
              <img src={currentStory.user?.avatar} alt="" className="story-user-avatar" />
              <span className="story-user-name">{currentStory.user?.username}</span>
              <span className="story-time">{Math.round((Date.now() - new Date(currentStory.createdAt)) / 3600000)}h</span>
              <div className="story-header-actions">
                <button 
                  className={`story-like-btn ${currentStory.likes?.includes(user?.id || user?._id) ? 'liked' : ''}`}
                  onClick={() => handleStoryLike(currentStory._id)}
                >
                  <Heart size={20} fill={currentStory.likes?.includes(user?.id || user?._id) ? 'currentColor' : 'none'} color="white" />
                  {currentStory.likes?.length > 0 && <span className="story-like-count">{currentStory.likes.length}</span>}
                </button>
                {isOwner && (
                  <>
                    <button onClick={() => fetchViewers(currentStory._id)} title="viewers">
                      <Eye size={20} color="white" />
                    </button>
                    <button onClick={() => handleDelete(currentStory._id)}>
                      <Trash2 size={20} color="white" />
                    </button>
                  </>
                )}
                <button onClick={closeStory}><X size={24} color="white" /></button>
              </div>
            </div>

            <img src={currentStory.image} alt="story" className="story-img" />

            {/* Render tags on viewer */}
            {currentStory.tags?.length > 0 && (
              <div className="story-tag-overlay">
                {currentStory.tags.map(tag => (
                   <Link 
                     key={tag._id} 
                     to={`/profile/${tag.username}`} 
                     className="story-tag-item"
                     onClick={e => e.stopPropagation()}
                   >
                     @{tag.username}
                   </Link>
                ))}
              </div>
            )}

            {/* Render text overlay on viewer */}
            {currentStory.text && (
              <div
                className="story-text-overlay"
                style={{
                  left: `${currentStory.textStyle?.position?.x ?? 50}%`,
                  top: `${currentStory.textStyle?.position?.y ?? 50}%`,
                  color: currentStory.textStyle?.color || '#fff',
                  fontSize: `${currentStory.textStyle?.fontSize || 24}px`,
                  pointerEvents: 'none',
                }}
              >
                {currentStory.text}
              </div>
            )}

            <div className="story-nav-left" onClick={prevStory} />
            <div className="story-nav-right" onClick={nextStory} />

            {showViewers && (
              <div className="story-viewers-panel">
                <div className="viewers-header">
                  <Eye size={16} /> <span>{viewers.length} views</span>
                  <button onClick={() => setShowViewers(false)}><X size={16} /></button>
                </div>
                {viewers.length === 0 ? <p className="no-viewers">No views yet</p> : (
                  viewers.map(v => (
                    <div key={v._id} className="viewer-item">
                      <img src={v.avatar} alt={v.username} />
                      <span>{v.username}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default StoryRow;
