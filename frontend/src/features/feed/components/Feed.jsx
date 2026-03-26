import React, { useState, useEffect, useRef } from 'react';
import StoryRow from './StoryRow';
import Post from './Post';
import { API } from '../../../utils/api';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const sentinelRef = useRef();
  const observerRef = useRef();

  // Fetch saved IDs once
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(API.posts.saved, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { if (j.data) setSavedIds(j.data.map(p => p._id)); })
      .catch(() => {});
  }, []);

  const fetchPage = async (pageNum) => {
    if (loadingRef.current || !hasMoreRef.current && pageNum > 1) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API.posts.feed}?page=${pageNum}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setPosts(prev => pageNum === 1 ? json.data : [...prev, ...json.data]);
        const more = json.meta?.hasMore ?? false;
        setHasMore(more);
        hasMoreRef.current = more;
      }
    } catch (err) {
      console.error(err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Initial load
  useEffect(() => { fetchPage(1); }, []);

  // IntersectionObserver
  useEffect(() => {
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
        pageRef.current += 1;
        fetchPage(pageRef.current);
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, []);

  const handleDeletePost = (postId) => setPosts(prev => prev.filter(p => p._id !== postId));

  if (initialLoad) return <div className="feed-loading">Loading feed...</div>;

  return (
    <div className="feed">
      <StoryRow />
      <div className="posts-container">
        {posts.length > 0 ? (
          posts.map(post => (
            <Post key={post._id} post={post} onDelete={handleDeletePost} savedPostIds={savedIds} />
          ))
        ) : (
          <div className="no-posts"><p>No posts yet. Be the first to share!</p></div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />

        {loading && !initialLoad && (
          <div className="feed-loading-more">Loading more...</div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className="feed-end">You're all caught up</div>
        )}
      </div>
    </div>
  );
}

export default Feed;
