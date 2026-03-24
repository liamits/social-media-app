const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API = {
  auth: {
    login: `${BASE_URL}/api/auth/login`,
    register: `${BASE_URL}/api/auth/register`,
  },
  posts: {
    base: `${BASE_URL}/api/posts`,
    feed: `${BASE_URL}/api/posts/feed`,
    saved: `${BASE_URL}/api/posts/saved`,
    like: (id) => `${BASE_URL}/api/posts/${id}/like`,
    save: (id) => `${BASE_URL}/api/posts/${id}/save`,
    comment: (id) => `${BASE_URL}/api/posts/${id}/comment`,
    delete: (id) => `${BASE_URL}/api/posts/${id}`,
    deleteComment: (postId, commentId) => `${BASE_URL}/api/posts/${postId}/comment/${commentId}`,
  },
  users: {
    search: (q) => `${BASE_URL}/api/users/search?q=${q}`,
    suggestions: `${BASE_URL}/api/users/suggestions`,
    profile: (username) => `${BASE_URL}/api/users/profile/${username}`,
    profileById: (id) => `${BASE_URL}/api/users/profile/id/${id}`,
    follow: (id) => `${BASE_URL}/api/users/follow/${id}`,
    update: `${BASE_URL}/api/users/update`,
    followers: (id) => `${BASE_URL}/api/users/${id}/followers`,
    following: (id) => `${BASE_URL}/api/users/${id}/following`,
  },
  messages: {
    conversations: `${BASE_URL}/api/messages/conversations`,
    get: (id) => `${BASE_URL}/api/messages/${id}`,
    send: (id) => `${BASE_URL}/api/messages/send/${id}`,
  },
  notifications: {
    base: `${BASE_URL}/api/notifications`,
    unreadCount: `${BASE_URL}/api/notifications/unread-count`,
    readAll: `${BASE_URL}/api/notifications/read-all`,
  },
  stories: {
    base: `${BASE_URL}/api/stories`,
    view: (id) => `${BASE_URL}/api/stories/${id}/view`,
    viewers: (id) => `${BASE_URL}/api/stories/${id}/viewers`,
    delete: (id) => `${BASE_URL}/api/stories/${id}`,
  },
  upload: `${BASE_URL}/api/upload`,
  socketUrl: BASE_URL,
};
