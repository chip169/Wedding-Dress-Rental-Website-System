import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout as serviceLogout } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || localStorage.getItem('accessToken') || null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Đồng bộ thông tin người dùng từ backend khi mở app
  useEffect(() => {
    const syncUser = async () => {
      if (token) {
        try {
          const res = await getMe();
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch (err) {
          // Nếu token không hợp lệ (401), đăng xuất an toàn
          if (err.status === 401) {
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    syncUser();
  }, [token]);

  const login = (userData, authToken) => {
    if (authToken) {
      localStorage.setItem('token', authToken);
      setToken(authToken);
    }
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    serviceLogout();
    setUser(null);
    setToken(null);
  };

  const isLoggedIn = !!token && !!user;
  const role = (user?.role || user?.roleId?.code || (token ? 'customer' : 'guest')).toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        role,
        isLoading,
        isAdmin: role === 'admin',
        isStaff: role === 'staff' || role === 'admin',
        isCustomer: role === 'customer',
        login,
        logout,
      }}
    >
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
