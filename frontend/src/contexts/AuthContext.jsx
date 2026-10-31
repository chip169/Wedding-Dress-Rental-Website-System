import React, { createContext, useContext, useEffect, useState } from 'react';
import { getProfile } from '../services/profileService';

const AuthContext = createContext(null);
const AUTH_USER_KEY = 'unibridal.authUser';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY) || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(!!token);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let active = true;
    getProfile().then((profile) => {
      if (!active) return;
      setUser(profile);
      (localStorage.getItem('token') ? localStorage : sessionStorage).setItem(AUTH_USER_KEY, JSON.stringify(profile));
    }).catch((error) => {
      if (active && error?.status === 401) logout();
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const login = (userData, authToken, remember = true) => {
    if (!authToken || !userData) throw new Error('Thiếu dữ liệu đăng nhập.');
    localStorage.removeItem('token'); localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem('token'); sessionStorage.removeItem(AUTH_USER_KEY);
    const store = remember ? localStorage : sessionStorage;
    store.setItem('token', authToken);
    store.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const updateUser = (profile) => {
    (localStorage.getItem('token') ? localStorage : sessionStorage).setItem(AUTH_USER_KEY, JSON.stringify(profile));
    setUser(profile);
  };

  const updateToken = (nextToken) => {
    (localStorage.getItem('token') ? localStorage : sessionStorage).setItem('token', nextToken);
    setToken(nextToken);
  };

  return <AuthContext.Provider value={{ user, token, loading, isLoggedIn: !!token && !!user, role: user?.role || 'guest', login, logout, updateUser, updateToken }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
