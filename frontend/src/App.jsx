import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/customer/HomePage';
import ProfilePage from './pages/customer/ProfilePage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import ChangePasswordPage from './pages/customer/ChangePasswordPage';
import CollectionPage from './pages/customer/CollectionPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DressDetailPage from './pages/customer/DressDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import AppointmentPage from './pages/customer/AppointmentPage';
import GuestBookingPage from './pages/customer/GuestBookingPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import RevenueReportPage from './pages/admin/RevenueReportPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/bo-suu-tap" element={<CollectionPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/dat-coc" element={<CheckoutPage />} />
        <Route path="/thanh-toan" element={<CheckoutPage />} />
        <Route path="/ky-hop-dong" element={<CheckoutPage />} />
        <Route path="/dat-lich" element={<AppointmentPage />} />
        <Route path="/appointment" element={<AppointmentPage />} />
        <Route path="/booking" element={<AppointmentPage />} />
        <Route path="/thue-nhanh" element={<GuestBookingPage />} />
        <Route path="/guest-booking" element={<GuestBookingPage />} />
        <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/reports/revenue" element={<RevenueReportPage />} />
        <Route path="/admin/revenue" element={<Navigate to="/admin/reports/revenue" replace />} />
        <Route path="/dresses/:id" element={<DressDetailPage />} />
        <Route path="/dress/:id" element={<DressDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/orders" element={<OrderHistoryPage />} />
        <Route path="/profile/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/profile/password" element={<ChangePasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
