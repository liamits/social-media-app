import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API } from '../api/api';

export default function MessagesScreen() {
  const { getToken } = useAuth();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    getToken().then(async t => {
      const res = await fetch(API.messages.conversations, { headers: { Authorization: `Bearer ${t}` } });
      const json = await res.json();
      if (res.ok) setConversations(json.data);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={item => item._id}
        renderItem={({ item }) => {
          const other = item.otherParticipant;
          return (
            <TouchableOpacity style={styles.convItem}>
              <Image source={{ uri: other?.avatar }} style={styles.avatar} />
              <View style={styles.convInfo}>
                <Text style={styles.username}>{other?.username}</Text>
                <Text style={styles.lastMsg} numberOfLines={1}>Tap to chat</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 16, borderBottomWidth: 0.3, borderBottomColor: '#333' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  convItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  convInfo: { flex: 1 },
  username: { color: '#fff', fontWeight: '600', fontSize: 14 },
  lastMsg: { color: '#888', fontSize: 13, marginTop: 2 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});
