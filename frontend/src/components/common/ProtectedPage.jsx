import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedPage({ children, roles }) {
  const { isLoggedIn, loading, role } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#fff8f6] text-[#874e57]">Đang xác thực tài khoản...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(role)) return <Navigate to={role === 'admin' ? '/admin/dashboard' : role === 'staff' ? '/staff/dashboard' : '/profile'} replace />;
  return children;
}
