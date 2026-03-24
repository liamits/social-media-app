import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { API } from '../../../utils/api';
import './StoryRow.css';

function StoryRow() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [viewing, setViewing] = useState(null); // { group, index }
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef();
  const timerRef = useRef();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.stories.base, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setGroups(data);
    } catch (err) { console.error(err); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch(API.upload, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const { url } = await uploadRes.json();

      const storyRes = await fetch(API.stories.base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: url }),
      });
      if (storyRes.ok) fetchStories();
    } catch (err) { console.error(err); }
  };

  const openStory = (group, index = 0) => {
    setViewing({ group, index });
    setProgress(0);
    markViewed(group.stories[index]._id);
  };

  const markViewed = async (storyId) => {
    const token = localStorage.getItem('token');
    await fetch(API.stories.view(storyId), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
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
      // Next group
      const gi = groups.findIndex(g => g.user._id === group.user._id);
      if (gi + 1 < groups.length) openStory(groups[gi + 1]);
      else closeStory();
    }
  };

  const prevStory = () => {
    if (!viewing) return;
    const { group, index } = viewing;
    if (index > 0) {
      setViewing({ group, index: index - 1 });
      setProgress(0);
    }
  };

  const closeStory = () => {
    setViewing(null);
    setShowViewers(false);
    setViewers([]);
    clearInterval(timerRef.current);
  };

  // Auto-progress
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
      const data = await res.json();
      if (res.ok) { setViewers(data); setShowViewers(true); }
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
        {/* Add story */}
        <div className="story-item" onClick={() => fileInputRef.current.click()}>
          <div className="story-avatar-container user">
            <div className="story-avatar">
              <img src={user?.avatar} alt="you" />
            </div>
            <div className="add-story-badge"><Plus size={10} /></div>
          </div>
          <span className="story-username">Your story</span>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
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

      {/* Story viewer modal */}
      {viewing && currentStory && (
        <div className="story-modal" onClick={closeStory}>
          <div className="story-modal-inner" onClick={e => e.stopPropagation()}>
            {/* Progress bars */}
            <div className="story-progress-bars">
              {viewing.group.stories.map((_, i) => (
                <div key={i} className="story-progress-track">
                  <div className="story-progress-fill" style={{
                    width: i < viewing.index ? '100%' : i === viewing.index ? `${progress}%` : '0%'
                  }} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="story-header">
              <img src={currentStory.user?.avatar} alt="" className="story-user-avatar" />
              <span className="story-user-name">{currentStory.user?.username}</span>
              <span className="story-time">{Math.round((Date.now() - new Date(currentStory.createdAt)) / 3600000)}h</span>
              <div className="story-header-actions">
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

            {/* Image */}
            <img src={currentStory.image} alt="story" className="story-img" />

            {/* Nav zones */}
            <div className="story-nav-left" onClick={prevStory} />
            <div className="story-nav-right" onClick={nextStory} />

            {/* Viewers panel */}
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
