import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { API } from '../api/api';

const { width } = Dimensions.get('window');
const IMG = (width - 4) / 3;

export default function ExploreScreen() {
  const { getToken } = useAuth();
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getToken().then(async t => {
      const res = await fetch(`${API.posts.base}?limit=30`, { headers: { Authorization: `Bearer ${t}` } });
      const json = await res.json();
      if (res.ok) setPosts(json.data || []);
    });
  }, []);

  const handleSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) { setUsers([]); return; }
    const t = await getToken();
    const res = await fetch(API.users.search(q), { headers: { Authorization: `Bearer ${t}` } });
    const json = await res.json();
    if (res.ok) setUsers(json.data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.searchBar}>
        <Search size={16} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Search"
          placeholderTextColor="#888"
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      {users.length > 0 ? (
        <FlatList
          data={users}
          keyExtractor={u => u._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userItem}>
              <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
              <View>
                <Text style={styles.username}>{item.username}</Text>
                {item.fullName ? <Text style={styles.fullName}>{item.fullName}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item._id}
          numColumns={3}
          renderItem={({ item }) => (
            <Image source={{ uri: item.image || item.images?.[0] }} style={styles.gridImg} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  gridImg: { width: IMG, height: IMG, margin: 0.5 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  username: { color: '#fff', fontWeight: '600', fontSize: 14 },
  fullName: { color: '#888', fontSize: 13 },
});
