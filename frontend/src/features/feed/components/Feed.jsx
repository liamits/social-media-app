import React, { useState, useEffect } from 'react';
import StoryRow from './StoryRow';
import Post from './Post';
import './Feed.css';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/posts/feed', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setPosts(data);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div className="feed-loading">Loading feed...</div>;

  return (
    <div className="feed">
      <StoryRow />
      <div className="posts-container">
        {posts.length > 0 ? (
          posts.map(post => (
            <Post key={post._id} post={post} />
          ))
        ) : (
          <div className="no-posts">
            <p>No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Feed;
