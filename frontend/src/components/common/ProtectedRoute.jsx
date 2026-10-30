import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotFoundPage from '../../pages/common/NotFoundPage';

/**
 * Route Guard phân quyền trên giao diện Frontend
 * Hiển thị màn hình 404/Quyền truy cập khi chưa đăng nhập hoặc không đủ thẩm quyền
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

  // Chưa đăng nhập -> Hiển thị màn hình yêu cầu đăng nhập (401/404)
  if (!isLoggedIn) {
    return <NotFoundPage type="unauthenticated" />;
  }

  // Đã đăng nhập nhưng không đủ quyền (ví dụ Customer vào link Admin/Staff) -> Hiển thị màn hình giới hạn quyền (403/404)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <NotFoundPage type="forbidden" />;
  }

  return children;
}

