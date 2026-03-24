import React, { useState, useEffect, useRef, useCallback } from 'react';
import StoryRow from './StoryRow';
import Post from './Post';
import { API } from '../../../utils/api';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const observerRef = useRef();
  const sentinelRef = useRef();

  // Fetch saved IDs once
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(API.posts.saved, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { if (j.data) setSavedIds(j.data.map(p => p._id)); })
      .catch(() => {});
  }, []);

  const fetchPage = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API.posts.feed}?page=${pageNum}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setPosts(prev => pageNum === 1 ? json.data : [...prev, ...json.data]);
        setHasMore(json.meta?.hasMore ?? false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchPage(1); }, [fetchPage]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => {
          const next = prev + 1;
          fetchPage(next);
          return next;
        });
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, fetchPage]);

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

        {/* Sentinel element - trigger load more */}
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
