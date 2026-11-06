import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/customer/HomePage';
import ProfilePage from './pages/customer/ProfilePage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import ChangePasswordPage from './pages/customer/ChangePasswordPage';
import CollectionPage from './pages/customer/CollectionPage';
import WishlistPage from './pages/customer/WishlistPage';
import AboutUsPage from './pages/customer/AboutUsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DressDetailPage from './pages/customer/DressDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import VietQRGatewayPage from './pages/customer/VietQRGatewayPage';
import AppointmentPage from './pages/customer/AppointmentPage';
import MessagesPage from './pages/customer/MessagesPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import RevenueReportPage from './pages/admin/RevenueReportPage';
import OrderRentalManagement from './pages/admin/OrderRentalManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import CustomerCareManagement from './pages/admin/CustomerCareManagement';
import ContractManagement from './pages/admin/ContractManagement';
import ContractTemplateManagement from './pages/admin/ContractTemplateManagement';
import AccountManagement from './pages/admin/AccountManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import ScheduleOverviewPage from './pages/admin/ScheduleOverviewPage';
import NotFoundPage from './pages/common/NotFoundPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<HomePage />} />
               <Route path="/about" element={<AboutUsPage />} />
              <Route path="/ve-chung-toi" element={<AboutUsPage />} />
              <Route path="/contact" element={<Navigate to="/about" replace />} />
              <Route path="/lien-he" element={<Navigate to="/about" replace />} />
              <Route path="/wishlist" element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}><WishlistPage /></ProtectedRoute>} />
              <Route path="/yeu-thich" element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}><WishlistPage /></ProtectedRoute>} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/collections" element={<CollectionPage />} />
              <Route path="/bo-suu-tap" element={<CollectionPage />} />
              <Route path="/pricing" element={<Navigate to="/collection" replace />} />
              <Route path="/bang-gia" element={<Navigate to="/collection" replace />} />
              <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/dat-coc" element={<CheckoutPage />} />
              <Route path="/thanh-toan" element={<CheckoutPage />} />
              <Route path="/ky-hop-dong" element={<CheckoutPage />} />
              <Route path="/thanh-toan-vietqr/:orderCode" element={<VietQRGatewayPage />} />
              <Route path="/thanh-toan-vietqr" element={<VietQRGatewayPage />} />
              <Route path="/payment/vietqr/:orderCode" element={<VietQRGatewayPage />} />
              <Route path="/payment/vietqr" element={<VietQRGatewayPage />} />
              <Route path="/dat-lich" element={<AppointmentPage />} />
              <Route path="/appointment" element={<AppointmentPage />} />
              <Route path="/booking" element={<AppointmentPage />} />
              <Route path="/thue-nhanh" element={<Navigate to="/dat-lich" replace />} />
              <Route path="/guest-booking" element={<Navigate to="/dat-lich" replace />} />
              <Route path="/thue-vay-guest" element={<Navigate to="/dat-lich" replace />} />
              <Route path="/thu-vay-guest" element={<Navigate to="/dat-lich" replace />} />
              <Route path="/dat-lich-guest" element={<Navigate to="/dat-lich" replace />} />
              <Route path="/dang-ky-guest" element={<Navigate to="/dat-lich" replace />} />
              <Route path="/tin-nhan" element={<MessagesPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/chat" element={<MessagesPage />} />
              <Route path="/dresses/:id" element={<DressDetailPage />} />
              <Route path="/dress/:id" element={<DressDetailPage />} />

              {/* Protected Customer Profile */}
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}><ProfilePage /></ProtectedRoute>} />
              <Route path="/profile/orders" element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}><OrderHistoryPage /></ProtectedRoute>} />
              <Route path="/profile/orders/:orderId" element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/profile/password" element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}><ChangePasswordPage /></ProtectedRoute>} />
              <Route path="/profile/appointments" element={<Navigate to="/profile" replace />} />
              <Route path="/tai-khoan/lich-hen" element={<Navigate to="/profile" replace />} />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Staff Routes */}
              <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><StaffDashboardPage /></ProtectedRoute>} />
              <Route path="/staff/lich-tong-quan" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ScheduleOverviewPage /></ProtectedRoute>} />
              <Route path="/staff/schedule" element={<Navigate to="/staff/lich-tong-quan" replace />} />
              <Route path="/staff/don-thue" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><OrderRentalManagement /></ProtectedRoute>} />
              <Route path="/staff/orders" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><OrderRentalManagement /></ProtectedRoute>} />
              <Route path="/staff/lich-hen" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ScheduleOverviewPage defaultTab="appointments" /></ProtectedRoute>} />
              <Route path="/staff/appointments" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ScheduleOverviewPage defaultTab="appointments" /></ProtectedRoute>} />
              <Route path="/staff/kho-hang" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><InventoryManagement /></ProtectedRoute>} />
              <Route path="/staff/inventory" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><InventoryManagement /></ProtectedRoute>} />
              <Route path="/staff/cham-soc-khach-hang" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><CustomerCareManagement /></ProtectedRoute>} />
              <Route path="/staff/customer-care" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><CustomerCareManagement /></ProtectedRoute>} />
              <Route path="/staff/hop-dong" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ContractManagement /></ProtectedRoute>} />
              <Route path="/staff/contracts" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ContractManagement /></ProtectedRoute>} />
              <Route path="/staff/profile" element={<Navigate to="/staff/dashboard" replace />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/lich-tong-quan" element={<ProtectedRoute allowedRoles={['admin']}><ScheduleOverviewPage /></ProtectedRoute>} />
              <Route path="/admin/schedule" element={<Navigate to="/admin/lich-tong-quan" replace />} />
              <Route path="/admin/reports/revenue" element={<ProtectedRoute allowedRoles={['admin']}><RevenueReportPage /></ProtectedRoute>} />
              <Route path="/admin/revenue" element={<Navigate to="/admin/reports/revenue" replace />} />
              <Route path="/admin/don-thue" element={<ProtectedRoute allowedRoles={['admin']}><OrderRentalManagement /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><OrderRentalManagement /></ProtectedRoute>} />
              <Route path="/admin/lich-hen" element={<ProtectedRoute allowedRoles={['admin']}><ScheduleOverviewPage defaultTab="appointments" /></ProtectedRoute>} />
              <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><ScheduleOverviewPage defaultTab="appointments" /></ProtectedRoute>} />
              <Route path="/admin/kho-hang" element={<ProtectedRoute allowedRoles={['admin']}><InventoryManagement /></ProtectedRoute>} />
              <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={['admin']}><InventoryManagement /></ProtectedRoute>} />
              <Route path="/admin/dresses" element={<Navigate to="/admin/kho-hang" replace />} />
              <Route path="/admin/san-pham" element={<Navigate to="/admin/kho-hang" replace />} />
              <Route path="/admin/cham-soc-khach-hang" element={<ProtectedRoute allowedRoles={['admin']}><CustomerCareManagement /></ProtectedRoute>} />
              <Route path="/admin/customer-care" element={<ProtectedRoute allowedRoles={['admin']}><CustomerCareManagement /></ProtectedRoute>} />
              <Route path="/admin/hop-dong" element={<ProtectedRoute allowedRoles={['admin']}><ContractManagement /></ProtectedRoute>} />
              <Route path="/admin/contracts" element={<ProtectedRoute allowedRoles={['admin']}><ContractManagement /></ProtectedRoute>} />
              <Route path="/admin/mau-hop-dong" element={<ProtectedRoute allowedRoles={['admin']}><ContractTemplateManagement /></ProtectedRoute>} />
              <Route path="/admin/contract-templates" element={<ProtectedRoute allowedRoles={['admin']}><ContractTemplateManagement /></ProtectedRoute>} />
              <Route path="/admin/accounts" element={<ProtectedRoute allowedRoles={['admin']}><AccountManagement /></ProtectedRoute>} />
              <Route path="/admin/users" element={<Navigate to="/admin/accounts" replace />} />
              <Route path="/admin/tai-khoan" element={<Navigate to="/admin/accounts" replace />} />
              <Route path="/admin/danh-muc" element={<ProtectedRoute allowedRoles={['admin']}><CategoryManagement /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<Navigate to="/admin/danh-muc" replace />} />
              
              {/* Common Aliases */}
              <Route path="/lich-tong-quan" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ScheduleOverviewPage /></ProtectedRoute>} />
              <Route path="/quan-ly-tai-khoan" element={<ProtectedRoute allowedRoles={['admin']}><AccountManagement /></ProtectedRoute>} />
              <Route path="/quan-ly-danh-muc" element={<ProtectedRoute allowedRoles={['admin']}><CategoryManagement /></ProtectedRoute>} />
              <Route path="/quan-ly-don-thue" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><OrderRentalManagement /></ProtectedRoute>} />
              <Route path="/quan-ly-lich-hen" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ScheduleOverviewPage defaultTab="appointments" /></ProtectedRoute>} />
              <Route path="/quan-ly-kho-hang" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><InventoryManagement /></ProtectedRoute>} />
              <Route path="/cham-soc-khach-hang" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><CustomerCareManagement /></ProtectedRoute>} />
              <Route path="/quan-ly-hop-dong" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ContractManagement /></ProtectedRoute>} />
              <Route path="/hop-dong" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ContractManagement /></ProtectedRoute>} />
              <Route path="/quan-ly-mau-hop-dong" element={<ProtectedRoute allowedRoles={['admin']}><ContractTemplateManagement /></ProtectedRoute>} />
              <Route path="/mau-hop-dong" element={<ProtectedRoute allowedRoles={['admin']}><ContractTemplateManagement /></ProtectedRoute>} />

              {/* Error & Access Control Routes */}
              <Route path="/404" element={<NotFoundPage type="404" />} />
              <Route path="/403" element={<NotFoundPage type="forbidden" />} />
              <Route path="/401" element={<NotFoundPage type="unauthenticated" />} />
              <Route path="*" element={<NotFoundPage type="404" />} />
            </Routes>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
