import React from 'react';
import './Grid.css';

const explorePosts = [
  { id: 1, url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop' },
  { id: 2, url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop' },
  { id: 3, url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800&auto=format&fit=crop' },
  { id: 4, url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop' },
  { id: 5, url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop' },
  { id: 6, url: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?q=80&w=800&auto=format&fit=crop' },
  { id: 7, url: 'https://images.unsplash.com/photo-1505144808405-02622407151e?q=80&w=800&auto=format&fit=crop' },
  { id: 8, url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=800&auto=format&fit=crop' },
  { id: 9, url: 'https://images.unsplash.com/photo-1433086566207-c58474389958?q=80&w=800&auto=format&fit=crop' },
];

function Explore() {
  return (
    <div className="explore-page">
      <div className="posts-grid">
        {explorePosts.map(post => (
          <div key={post.id} className="grid-item">
            <img src={post.url} alt="Explore" />
            <div className="grid-overlay">
              <span>❤️ 1.2k</span>
              <span>💬 45</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Explore;
