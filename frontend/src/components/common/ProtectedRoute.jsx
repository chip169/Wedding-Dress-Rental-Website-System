import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Route Guard phân quyền trên giao diện Frontend
 * @param {Array<string>} allowedRoles - ['admin'], ['staff', 'admin'], ['customer']
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="w-8 h-8 border-4 border-[#B8737D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Chưa đăng nhập -> Chuyển về trang đăng nhập
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đã đăng nhập nhưng không đủ quyền
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Nếu là staff cố vào trang admin độc quyền -> về staff dashboard
    if (role === 'staff') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    // Nếu là customer cố vào trang admin/staff -> về trang chủ
    return <Navigate to="/" replace />;
  }

  return children;
}

