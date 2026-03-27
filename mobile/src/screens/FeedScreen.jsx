import React, { useState, useEffect, useRef } from 'react';
import {
  View, FlatList, Text, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  ScrollView, SafeAreaView, StatusBar, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Heart, MessageCircle, Send, Bookmark, Plus, MoreHorizontal, SquarePen, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { API } from '../api/api';

function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBtn}>
        <Plus size={26} color="#fff" strokeWidth={1.5} />
      </TouchableOpacity>
      <Text style={styles.headerLogo}>Instagram</Text>
      <TouchableOpacity style={styles.headerBtn}>
        <Heart size={24} color="#fff" strokeWidth={1.5} />
      </TouchableOpacity>
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

  const avatarUri = currentUser?.avatar || null;
  const initials = (currentUser?.username || 'U')[0].toUpperCase();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.storyRow}
      contentContainerStyle={{ paddingHorizontal: 8 }}
    >
      <TouchableOpacity style={styles.storyItem}>
        <View style={styles.yourStoryWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.storyAvatar} />
          ) : (
            <View style={[styles.storyAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
          )}
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

function CommentModal({ visible, post, token, currentUser, onClose }) {
  const [comments, setComments] = useState(post?.comments || []);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { setComments(post?.comments || []); }, [post]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(API.posts.comment(post._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (res.ok) { setComments(json.data.comments); setText(''); }
    } catch (e) { console.error(e); }
    setSending(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.commentSheet}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#fff" /></TouchableOpacity>
          </View>
          <FlatList
            data={comments}
            keyExtractor={(c, i) => c._id || String(i)}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image
                  source={{ uri: item.user?.avatar || 'https://res.cloudinary.com/djx14arnq/image/upload/v1774602464/social-app/default_avatar.jpg' }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentBody}>
                  <Text style={styles.commentUsername}>{item.user?.username} </Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.noComments}>No comments yet</Text>}
          />
          <View style={styles.commentInput}>
            <Image
              source={{ uri: currentUser?.avatar || 'https://res.cloudinary.com/djx14arnq/image/upload/v1774602464/social-app/default_avatar.jpg' }}
              style={styles.commentAvatar}
            />
            <TextInput
              style={styles.commentTextInput}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending}>
              <Text style={[styles.postBtn, (!text.trim() || sending) && { opacity: 0.4 }]}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PostItem({ post, currentUserId, token, currentUser }) {
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId));
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);

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
          <Image source={{ uri: post.user?.avatar || 'https://ui-avatars.com/api/?name=U&background=555&color=fff' }} style={styles.postAvatar} />
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
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
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
      <TouchableOpacity onPress={() => setShowComments(true)}>
        {post.comments?.length > 0 && (
          <Text style={styles.viewComments}>View all {post.comments.length} comments</Text>
        )}
      </TouchableOpacity>
      <CommentModal
        visible={showComments}
        post={post}
        token={token}
        currentUser={currentUser}
        onClose={() => setShowComments(false)}
      />
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
          <PostItem post={item} currentUserId={user?.id} token={token} currentUser={user} />
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
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#000',
  },
  headerLogo: { color: '#fff', fontSize: 26, fontFamily: 'serif', fontStyle: 'italic', flex: 1, textAlign: 'center' },
  headerBtn: { width: 36 },

  // Story
  storyRow: { backgroundColor: '#000', paddingVertical: 12, borderBottomWidth: 0.3, borderBottomColor: '#333' },
  storyItem: { alignItems: 'center', marginHorizontal: 8, width: 72 },
  storyAvatar: { width: 62, height: 62, borderRadius: 31 },
  avatarFallback: { backgroundColor: '#444', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 22, fontWeight: '700' },
  yourStoryWrapper: { position: 'relative' },
  addBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#0095f6', borderRadius: 12,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#000',
  },
  storyRing: {
    padding: 2.5, borderRadius: 36,
    borderWidth: 2.5, borderColor: '#e1306c',
  },
  storyName: { fontSize: 11, marginTop: 5, color: '#fff', textAlign: 'center' },

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
  postCaption: { color: '#fff', fontSize: 13, paddingHorizontal: 12, paddingBottom: 4 },
  viewComments: { color: '#888', fontSize: 13, paddingHorizontal: 12, paddingBottom: 8 },

  // Comment modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  commentSheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '70%' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.3, borderBottomColor: '#333' },
  commentTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  commentItem: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentBody: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  commentUsername: { color: '#fff', fontWeight: '700', fontSize: 13 },
  commentText: { color: '#fff', fontSize: 13 },
  noComments: { color: '#666', textAlign: 'center', marginTop: 30 },
  commentInput: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 0.3, borderTopColor: '#333' },
  commentTextInput: { flex: 1, color: '#fff', fontSize: 14, marginHorizontal: 10, maxHeight: 80 },
  postBtn: { color: '#0095f6', fontWeight: '700', fontSize: 14 },
});

// append styles - these will be merged via spread in the StyleSheet below
