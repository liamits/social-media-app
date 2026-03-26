import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Info, Image as ImageIcon, Heart, Smile, MessageCircle, X, Send } from 'lucide-react';
import { API } from '../../../utils/api';
import './Chat.css';

function Chat() {
  const [searchParams] = useSearchParams();
  const userIdFromQuery = searchParams.get('userId');

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [mediaPreview, setMediaPreview] = useState(null); // { file, url, type }
  const [uploading, setUploading] = useState(false);
  const { socket, onlineUsers } = useSocket();
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!userIdFromQuery) return;
    const fetchUser = async () => {
      try {
        const res = await fetch(API.users.profileById(userIdFromQuery));
        const json = await res.json();
        if (res.ok) setSelectedUser(json.data.user);
      } catch (err) { console.error(err); }
    };
    fetchUser();
  }, [userIdFromQuery]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API.messages.get(selectedUser._id), { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (res.ok) setMessages(json.data);
      } catch (err) { console.error(err); }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      const msgSenderId = message.senderId?.toString();
      const selectedId = selectedUser?._id?.toString();
      if (selectedId && msgSenderId === selectedId) {
        setMessages(prev => [...prev, message]);
      }
      setConversations(prev => {
        const idx = prev.findIndex(c => c.otherParticipant?._id?.toString() === msgSenderId);
        if (idx <= 0) return prev;
        const updated = [...prev];
        const [conv] = updated.splice(idx, 1);
        return [conv, ...updated];
      });
    };
    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, selectedUser]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isGif = file.type === 'image/gif';
    const type = isVideo ? 'video' : isGif ? 'gif' : 'image';
    setMediaPreview({ file, url: URL.createObjectURL(file), type });
    e.target.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaPreview) || !selectedUser) return;

    try {
      const token = localStorage.getItem('token');

      if (mediaPreview) {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', mediaPreview.file);
        const uploadRes = await fetch(API.upload, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error('Upload failed');

        const res = await fetch(API.messages.send(selectedUser._id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            message: newMessage || '',
            type: uploadJson.data.type,
            mediaUrl: uploadJson.data.url,
          }),
        });
        const json = await res.json();
        if (res.ok) setMessages(prev => [...prev, json.data]);
        setMediaPreview(null);
        setNewMessage('');
        setUploading(false);
      } else {
        const res = await fetch(API.messages.send(selectedUser._id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: newMessage }),
        });
        const json = await res.json();
        if (res.ok) { setMessages(prev => [...prev, json.data]); setNewMessage(''); }
      }
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API.messages.conversations, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (res.ok) setConversations(json.data);
      } catch (err) { console.error(err); }
      finally { setLoadingConv(false); }
    };
    fetchConversations();
  }, []);

  const renderMessageContent = (msg) => {
    if (msg.type === 'post' && msg.postId) {
      return (
        <Link to={`/profile/${msg.postId.user?.username}`} className="shared-post-content">
          <img src={msg.postId.images?.[0] || msg.postId.image} alt="Shared post" className="shared-post-img" />
          <div className="shared-post-info">
            <span className="shared-post-user">{msg.postId.user?.username}</span>
            <p className="shared-post-caption">{msg.postId.caption}</p>
          </div>
        </Link>
      );
    }
    if (msg.type === 'image' || msg.type === 'gif') {
      return (
        <div className="msg-media">
          <img src={msg.mediaUrl} alt="media" className="msg-media-img" />
          {msg.message && <p className="msg-media-caption">{msg.message}</p>}
        </div>
      );
    }
    if (msg.type === 'video') {
      return (
        <div className="msg-media">
          <video src={msg.mediaUrl} controls className="msg-media-video" />
          {msg.message && <p className="msg-media-caption">{msg.message}</p>}
        </div>
      );
    }
    return msg.message;
  };

  return (
    <div className="chat-container">
      <div className="conversations-sidebar">
        <header className="conv-header"><h3>Messages</h3></header>
        <div className="conv-list">
          {loadingConv ? (
            <p className="loading-text">Loading...</p>
          ) : conversations.length > 0 ? (
            conversations.map(conv => {
              const other = conv.otherParticipant;
              const isOnline = onlineUsers.includes(other._id?.toString());
              return (
                <div
                  key={conv._id}
                  className={`conv-item ${selectedUser?._id === other._id ? 'active' : ''}`}
                  onClick={() => setSelectedUser(other)}
                >
                  <div className="conv-avatar-wrapper">
                    <img src={other.avatar} alt={other.username} className="conv-avatar" />
                    {isOnline && <div className="online-badge" />}
                  </div>
                  <div className="conv-info">
                    <span className="conv-username">{other.username}</span>
                    <span className="conv-status">{isOnline ? 'Active now' : 'Offline'}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-conv">No conversations yet.</p>
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedUser ? (
          <>
            <header className="chat-header">
              <div className="chat-user-info">
                <div className="chat-avatar-wrapper">
                  <img src={selectedUser.avatar} alt={selectedUser.username} className="chat-avatar" />
                  {onlineUsers.includes(selectedUser._id?.toString()) && <div className="online-badge-sm" />}
                </div>
                <div>
                  <span className="chat-username">{selectedUser.username}</span>
                  {onlineUsers.includes(selectedUser._id?.toString()) && (
                    <p className="chat-online-status">Active now</p>
                  )}
                </div>
              </div>
              <Info size={24} className="info-icon" />
            </header>

            <div className="messages-area">
              {messages.map((msg, i) => {
                const isSent = msg.senderId?.toString() === currentUser?.id;
                return (
                  <div key={msg._id || i} className={`message-bubble ${isSent ? 'sent' : 'received'} ${msg.type === 'post' ? 'post-msg' : ''} ${['image','gif','video'].includes(msg.type) ? 'media-msg' : ''}`}>
                    {renderMessageContent(msg)}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Media preview */}
            {mediaPreview && (
              <div className="media-preview-bar">
                <button className="media-preview-remove" onClick={() => setMediaPreview(null)}>
                  <X size={16} />
                </button>
                {mediaPreview.type === 'video' ? (
                  <video src={mediaPreview.url} className="media-preview-thumb" />
                ) : (
                  <img src={mediaPreview.url} alt="preview" className="media-preview-thumb" />
                )}
                <span className="media-preview-label">{mediaPreview.type.toUpperCase()}</span>
              </div>
            )}

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <Smile size={24} />
              <input
                type="text"
                placeholder={mediaPreview ? 'Add a caption...' : 'Message...'}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/gif,video/mp4,video/quicktime,video/webm"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              {(newMessage.trim() || mediaPreview) ? (
                <button type="submit" className="send-btn" disabled={uploading}>
                  {uploading ? '...' : <Send size={18} />}
                </button>
              ) : (
                <div className="input-icons">
                  <button type="button" onClick={() => fileInputRef.current.click()}>
                    <ImageIcon size={24} />
                  </button>
                  <Heart size={24} />
                </div>
              )}
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-chat-icon"><MessageCircle size={60} strokeWidth={1} /></div>
            <h2>Your Messages</h2>
            <p>Send private photos and messages to a friend.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
