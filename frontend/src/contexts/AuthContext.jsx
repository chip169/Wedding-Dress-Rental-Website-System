import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout as serviceLogout } from '../services/authService';
import { getProfile } from '../services/profileService';
import { syncUserWishlistFromBackend, WISHLIST_EVENT } from '../services/wishlistService';

const AuthContext = createContext(null);
const AUTH_USER_KEY = 'unibridal.authUser';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('accessToken') || null;
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user') || localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    // Nếu đã có sẵn thông tin user từ localStorage/sessionStorage, không cần block màn hình bằng loading spinner
    const saved = localStorage.getItem('user') || localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
    if (saved) return false;
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('accessToken'));
  });

  const logout = () => {
    serviceLogout();
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
    setIsLoading(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT));
    }, 50);
  };

  // Đồng bộ thông tin người dùng từ backend khi mở app
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let active = true;

    const syncUser = async () => {
      try {
        let profileData = null;
        try {
          const res = await getMe();
          if (res?.data) profileData = res.data;
        } catch {
          // Fallback to getProfile()
          try {
            profileData = await getProfile();
          } catch {
            // ignore
          }
        }

        if (active && profileData) {
          setUser(profileData);
          localStorage.setItem('user', JSON.stringify(profileData));
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profileData));
          syncUserWishlistFromBackend(profileData);
        }
      } catch (err) {
        if (active && (err?.status === 401 || err?.response?.status === 401)) {
          logout();
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    syncUser();

    return () => {
      active = false;
    };
  }, [token]);

  const login = (userData, authToken, remember = true) => {
    if (!authToken || !userData) {
      throw new Error('Thiếu dữ liệu đăng nhập.');
    }

    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem(AUTH_USER_KEY);

    const store = remember ? localStorage : sessionStorage;
    store.setItem('token', authToken);
    store.setItem('user', JSON.stringify(userData));
    store.setItem(AUTH_USER_KEY, JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT));
      syncUserWishlistFromBackend(userData);
    }, 50);
  };

  const updateUser = (profile) => {
    localStorage.setItem('user', JSON.stringify(profile));
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
    setUser(profile);
  };

  const updateToken = (nextToken) => {
    localStorage.setItem('token', nextToken);
    sessionStorage.setItem('token', nextToken);
    setToken(nextToken);
  };

  const isLoggedIn = !!token && !!user;
  const rawRole = user?.role || user?.roleId?.code || (token ? 'customer' : 'guest');
  const role = (typeof rawRole === 'string' ? rawRole : 'guest').toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        role,
        isLoading,
        loading: isLoading,
        isAdmin: role === 'admin',
        isStaff: role === 'staff' || role === 'admin',
        isCustomer: role === 'customer',
        login,
        logout,
        updateUser,
        updateToken,
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

export default AuthContext;
