import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API } from '../api/api';

export default function NotificationsScreen() {
  const { getToken } = useAuth();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    getToken().then(async t => {
      const res = await fetch(API.notifications.base, { headers: { Authorization: `Bearer ${t}` } });
      const json = await res.json();
      if (res.ok) setNotifs(json.data || []);
    });
  }, []);

  const getMsg = (type) => {
    if (type === 'like') return 'liked your post.';
    if (type === 'comment') return 'commented on your post.';
    if (type === 'follow') return 'started following you.';
    return '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}><Text style={styles.title}>Notifications</Text></View>
      <FlatList
        data={notifs}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.sender?.avatar }} style={styles.avatar} />
            <Text style={styles.text}>
              <Text style={styles.bold}>{item.sender?.username}</Text> {getMsg(item.type)}
            </Text>
            {item.post?.image && <Image source={{ uri: item.post.image }} style={styles.postThumb} />}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 16, borderBottomWidth: 0.3, borderBottomColor: '#333' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  text: { flex: 1, color: '#fff', fontSize: 13 },
  bold: { fontWeight: '700' },
  postThumb: { width: 44, height: 44 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});
