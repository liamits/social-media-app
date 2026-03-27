import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../api/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken) {
          setToken(storedToken);
          // Fetch latest user data
          const res = await fetch(API.auth.me, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const json = await res.json();
          if (res.ok) {
            setUser(json.data);
            await AsyncStorage.setItem('user', JSON.stringify(json.data));
          } else if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (emailOrUsername, password) => {
    const res = await fetch(API.auth.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    const tk = json.data.token;
    // Fetch full user profile after login
    const meRes = await fetch(API.auth.me, { headers: { Authorization: `Bearer ${tk}` } });
    const meJson = await meRes.json();
    const fullUser = meRes.ok ? meJson.data : json.data.user;
    await AsyncStorage.setItem('token', tk);
    await AsyncStorage.setItem('user', JSON.stringify(fullUser));
    setToken(tk);
    setUser(fullUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const getToken = async () => AsyncStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};
