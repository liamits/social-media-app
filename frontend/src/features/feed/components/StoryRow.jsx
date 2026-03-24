import React from 'react';
import './StoryRow.css';

const stories = [
  { id: 1, username: 'your_story', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', isUser: true },
  { id: 2, username: 'traveler', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Travel' },
  { id: 3, username: 'foodie_vibe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Food' },
  { id: 4, username: 'nature_pics', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nature' },
  { id: 5, username: 'cinema_guy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Movie' },
  { id: 6, username: 'gamers_den', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Game' },
  { id: 7, username: 'fashion_week', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fashion' },
];

function StoryRow() {
  return (
    <div className="story-row">
      {stories.map(story => (
        <div key={story.id} className="story-item">
          <div className={`story-avatar-container ${story.isUser ? 'user' : 'unread'}`}>
            <div className="story-avatar">
              <img src={story.avatar} alt={story.username} />
            </div>
            {story.isUser && <div className="add-story-badge">+</div>}
          </div>
          <span className="story-username">{story.isUser ? 'Your story' : story.username}</span>
        </div>
      ))}
    </div>
  );
}

export default StoryRow;
