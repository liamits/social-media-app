import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { Info, Image as ImageIcon, Heart, Smile, MessageCircle } from 'lucide-react';
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
  const { socket, onlineUsers } = useSocket();
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef(null);

  // Fetch selected user info if from query or when changed
  useEffect(() => {
    if (userIdFromQuery) {
      const fetchUser = async () => {
        try {
          const response = await fetch(API.users.profileById(userIdFromQuery));
          const data = await response.json();
          if (response.ok) setSelectedUser(data.user);
        } catch (err) {
          console.error('Error fetching user for chat:', err);
        }
      };
      fetchUser();
    }
  }, [userIdFromQuery]);

  // Fetch messages when a user is selected
  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(API.messages.get(selectedUser._id), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok) setMessages(data);
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };
      fetchMessages();
    }
  }, [selectedUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      const msgSenderId = message.senderId?.toString();
      const msgReceiverId = message.receiverId?.toString();
      const selectedId = selectedUser?._id?.toString();
      const myId = currentUser?.id;

      // Only add to UI if it's an incoming message (not sent by me, already added via HTTP)
      if (msgSenderId !== myId && selectedUser && msgSenderId === selectedId) {
        setMessages(prev => [...prev, message]);
      }

      // Bubble conversation to top
      setConversations(prev => {
        const idx = prev.findIndex(c =>
          c.otherParticipant?._id?.toString() === msgSenderId ||
          c.otherParticipant?._id?.toString() === msgReceiverId
        );
        if (idx === -1) return prev;
        const updated = [...prev];
        const [conv] = updated.splice(idx, 1);
        return [conv, ...updated];
      });
    };
    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, selectedUser, currentUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API.messages.send(selectedUser._id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(API.messages.conversations, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setConversations(data);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoadingConv(false);
      }
    };
    fetchConversations();
  }, []);

  return (
    <div className="chat-container">
      <div className="conversations-sidebar">
        <header className="conv-header">
          <h3>Messages</h3>
        </header>
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
              {messages.map((msg, i) => (
                <div key={msg._id || i} className={`message-bubble ${msg.senderId?.toString() === currentUser?.id ? 'sent' : 'received'}`}>
                  {msg.message}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <Smile size={24} />
              <input 
                type="text" 
                placeholder="Message..." 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              {newMessage.trim() ? (
                <button type="submit" className="send-btn">Send</button>
              ) : (
                <div className="input-icons">
                  <ImageIcon size={24} />
                  <Heart size={24} />
                </div>
              )}
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-chat-icon">
               <MessageCircle size={60} strokeWidth={1} />
            </div>
            <h2>Your Messages</h2>
            <p>Send private photos and messages to a friend.</p>
            <button className="send-msg-btn">Send message</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
