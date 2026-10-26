import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadProfile, saveProfile, clearProfile } from '../services/profileService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadProfile()?.profile);
  const [token, setToken] = useState(() => localStorage.getItem('token') || localStorage.getItem('accessToken') || null);

  const login = (userData, authToken = 'mock_jwt_token_unibridal_2026') => {
    localStorage.setItem('token', authToken);
    saveProfile(userData);
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    clearProfile();
    setUser(null);
    setToken(null);
  };

  const isLoggedIn = !!token;
  const role = user?.role || (token ? 'admin' : 'guest');

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
