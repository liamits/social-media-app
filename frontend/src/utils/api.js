const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API = {
  auth: {
    login: `${BASE_URL}/api/auth/login`,
    register: `${BASE_URL}/api/auth/register`,
  },
  posts: {
    base: `${BASE_URL}/api/posts`,
    feed: `${BASE_URL}/api/posts/feed`,
    like: (id) => `${BASE_URL}/api/posts/${id}/like`,
    comment: (id) => `${BASE_URL}/api/posts/${id}/comment`,
  },
  users: {
    search: (q) => `${BASE_URL}/api/users/search?q=${q}`,
    suggestions: `${BASE_URL}/api/users/suggestions`,
    profile: (username) => `${BASE_URL}/api/users/profile/${username}`,
    profileById: (id) => `${BASE_URL}/api/users/profile/id/${id}`,
    follow: (id) => `${BASE_URL}/api/users/follow/${id}`,
    update: `${BASE_URL}/api/users/update`,
  },
  messages: {
    conversations: `${BASE_URL}/api/messages/conversations`,
    get: (id) => `${BASE_URL}/api/messages/${id}`,
    send: (id) => `${BASE_URL}/api/messages/send/${id}`,
  },
  upload: `${BASE_URL}/api/upload`,
  socketUrl: BASE_URL,
};
