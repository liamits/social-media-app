import React, { useState, useEffect, useRef } from 'react';
import {
  View, FlatList, Text, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { Heart, MessageCircle, Send, Bookmark, Plus, MoreHorizontal, PenSquare } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { API } from '../api/api';

function Header({ navigation }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerLogo}>Instagram</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerBtn}>
          <PenSquare size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn}>
          <Send size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StoryRow({ currentUser, token }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch(API.stories.base, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { if (j.data) setGroups(j.data); })
      .catch(() => {});
  }, [token]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.storyRow}
      contentContainerStyle={{ paddingHorizontal: 8 }}
    >
      {/* Your story */}
      <TouchableOpacity style={styles.storyItem}>
        <View style={styles.yourStoryWrapper}>
          <Image source={{ uri: currentUser?.avatar }} style={styles.storyAvatar} />
          <View style={styles.addBadge}>
            <Plus size={12} color="#fff" strokeWidth={3} />
          </View>
        </View>
        <Text style={styles.storyName} numberOfLines={1}>Tin của bạn</Text>
      </TouchableOpacity>

      {groups.map(group => (
        <TouchableOpacity key={group.user._id} style={styles.storyItem}>
          <View style={styles.storyRing}>
            <Image source={{ uri: group.user.avatar }} style={styles.storyAvatar} />
          </View>
          <Text style={styles.storyName} numberOfLines={1}>{group.user.username}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PostItem({ post, currentUserId, token }) {
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId));
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [saved, setSaved] = useState(false);

  const handleLike = async () => {
    setLiked(p => !p);
    setLikes(p => liked ? p - 1 : p + 1);
    await fetch(API.posts.like(post._id), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  };

  const handleSave = async () => {
    setSaved(p => !p);
    await fetch(API.posts.save(post._id), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  };

  return (
    <View style={styles.post}>
      {/* Post header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserRow}>
          <Image source={{ uri: post.user?.avatar }} style={styles.postAvatar} />
          <View>
            <Text style={styles.postUsername}>{post.user?.username}</Text>
            {post.location ? <Text style={styles.postLocation}>{post.location}</Text> : null}
          </View>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <Image
        source={{ uri: post.image || post.images?.[0] }}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* Actions */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Heart size={26} color={liked ? '#ed4956' : '#fff'} fill={liked ? '#ed4956' : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MessageCircle size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Send size={26} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave}>
          <Bookmark size={26} color="#fff" fill={saved ? '#fff' : 'none'} />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <Text style={styles.postLikes}>{likes.toLocaleString()} lượt thích</Text>

      {/* Caption */}
      {post.caption ? (
        <Text style={styles.postCaption}>
          <Text style={styles.postUsername}>{post.user?.username} </Text>
          {post.caption}
        </Text>
      ) : null}
    </View>
  );
}

export default function FeedScreen() {
  const { getToken, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [token, setToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    getToken().then(t => {
      setToken(t);
      fetchPage(1, true, t);
    });
  }, []);

  const fetchPage = async (pageNum, reset = false, tk) => {
    const t = tk || token;
    if (!t || loadingRef.current || (!hasMoreRef.current && pageNum > 1)) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`${API.posts.feed}?page=${pageNum}&limit=5`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const json = await res.json();
      if (res.ok) {
        setPosts(prev => reset ? json.data : [...prev, ...json.data]);
        const more = json.meta?.hasMore ?? false;
        setHasMore(more);
        hasMoreRef.current = more;
      }
    } catch (e) { console.error(e); }
    finally { loadingRef.current = false; setLoading(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    pageRef.current = 1;
    hasMoreRef.current = true;
    await fetchPage(1, true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMoreRef.current && !loadingRef.current) {
      pageRef.current += 1;
      fetchPage(pageRef.current);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <FlatList
        data={posts}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <PostItem post={item} currentUserId={user?.id} token={token} />
        )}
        ListHeaderComponent={
          <>
            <Header />
            <StoryRow currentUser={user} token={token} />
          </>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
        }
        ListFooterComponent={loading ? <ActivityIndicator color="#fff" style={{ padding: 16 }} /> : null}
        style={{ backgroundColor: '#000' }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#000',
  },
  headerLogo: { color: '#fff', fontSize: 26, fontFamily: 'serif', fontStyle: 'italic' },
  headerRight: { flexDirection: 'row' },
  headerBtn: { marginLeft: 16 },

  // Story
  storyRow: { backgroundColor: '#000', paddingVertical: 10, borderBottomWidth: 0.3, borderBottomColor: '#333' },
  storyItem: { alignItems: 'center', marginHorizontal: 8, width: 68 },
  storyAvatar: { width: 60, height: 60, borderRadius: 30 },
  yourStoryWrapper: { position: 'relative' },
  addBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#0095f6', borderRadius: 12,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#000',
  },
  storyRing: {
    padding: 2, borderRadius: 34,
    borderWidth: 2, borderColor: 'transparent',
    background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    // React Native gradient workaround - use solid color
    borderColor: '#e1306c',
  },
  storyName: { fontSize: 11, marginTop: 4, color: '#fff', textAlign: 'center' },

  // Post
  post: { backgroundColor: '#000', marginBottom: 4 },
  postHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  postUserRow: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },
  postUsername: { color: '#fff', fontWeight: '600', fontSize: 13 },
  postLocation: { color: '#aaa', fontSize: 11 },
  postImage: { width: '100%', aspectRatio: 1 },
  postActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  postActionsLeft: { flexDirection: 'row' },
  actionBtn: { marginRight: 14 },
  postLikes: { color: '#fff', fontWeight: '600', fontSize: 13, paddingHorizontal: 12, marginBottom: 4 },
  postCaption: { color: '#fff', fontSize: 13, paddingHorizontal: 12, paddingBottom: 8 },
});
