import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotFoundPage from '../../pages/common/NotFoundPage';

/**
 * Route Guard phân quyền trên giao diện Frontend
 * Chuyển hướng trực tiếp đến /login khi chưa đăng nhập, ngăn ngừa chèn màn 404/401 khi đăng xuất
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

  // Chưa đăng nhập -> Tự động chuyển hướng ngay sang trang đăng nhập (/login) mượt mà
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Đã đăng nhập nhưng không đủ quyền (ví dụ Customer vào link Admin/Staff) -> Hiển thị màn hình giới hạn quyền (403)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <NotFoundPage type="forbidden" />;
  }

  return children;
}

