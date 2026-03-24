import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import './StoryRow.css';

function StoryRow() {
  const { user } = useAuth();

  return (
    <div className="story-row">
      <div className="story-item">
        <div className="story-avatar-container user">
          <div className="story-avatar">
            <img src={user?.avatar} alt={user?.username} />
          </div>
          <div className="add-story-badge">+</div>
        </div>
        <span className="story-username">Your story</span>
      </div>
    </div>
  );
}

export default StoryRow;
