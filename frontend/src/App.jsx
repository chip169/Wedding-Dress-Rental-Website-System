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
import AppointmentPage from './pages/customer/AppointmentPage';
import GuestBookingPage from './pages/customer/GuestBookingPage';
import MessagesPage from './pages/customer/MessagesPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import RevenueReportPage from './pages/admin/RevenueReportPage';
import OrderRentalManagement from './pages/admin/OrderRentalManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import CustomerCareManagement from './pages/admin/CustomerCareManagement';
import ContractManagement from './pages/admin/ContractManagement';
import ContractTemplateManagement from './pages/admin/ContractTemplateManagement';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/ve-chung-toi" element={<AboutUsPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/yeu-thich" element={<WishlistPage />} />
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
              <Route path="/thue-vay-guest" element={<GuestBookingPage />} />
              <Route path="/thu-vay-guest" element={<GuestBookingPage />} />
              <Route path="/dat-lich-guest" element={<GuestBookingPage />} />
              <Route path="/dang-ky-guest" element={<GuestBookingPage />} />
              <Route path="/tin-nhan" element={<MessagesPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/chat" element={<MessagesPage />} />
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
              
              {/* Admin & Staff Management */}
              <Route path="/admin/don-thue" element={<OrderRentalManagement />} />
              <Route path="/admin/orders" element={<OrderRentalManagement />} />
              <Route path="/admin/kho-hang" element={<InventoryManagement />} />
              <Route path="/admin/inventory" element={<InventoryManagement />} />
              <Route path="/staff/don-thue" element={<OrderRentalManagement />} />
              <Route path="/staff/orders" element={<OrderRentalManagement />} />
              <Route path="/staff/kho-hang" element={<InventoryManagement />} />
              <Route path="/staff/inventory" element={<InventoryManagement />} />
              <Route path="/quan-ly-don-thue" element={<OrderRentalManagement />} />
              <Route path="/quan-ly-kho-hang" element={<InventoryManagement />} />
              <Route path="/admin/cham-soc-khach-hang" element={<CustomerCareManagement />} />
              <Route path="/admin/customer-care" element={<CustomerCareManagement />} />
              <Route path="/staff/cham-soc-khach-hang" element={<CustomerCareManagement />} />
              <Route path="/staff/customer-care" element={<CustomerCareManagement />} />
              <Route path="/cham-soc-khach-hang" element={<CustomerCareManagement />} />
              <Route path="/admin/hop-dong" element={<ContractManagement />} />
              <Route path="/admin/contracts" element={<ContractManagement />} />
              <Route path="/staff/hop-dong" element={<ContractManagement />} />
              <Route path="/staff/contracts" element={<ContractManagement />} />
              <Route path="/quan-ly-hop-dong" element={<ContractManagement />} />
              <Route path="/hop-dong" element={<ContractManagement />} />
              <Route path="/admin/mau-hop-dong" element={<ContractTemplateManagement />} />
              <Route path="/admin/contract-templates" element={<ContractTemplateManagement />} />
              <Route path="/quan-ly-mau-hop-dong" element={<ContractTemplateManagement />} />
              <Route path="/mau-hop-dong" element={<ContractTemplateManagement />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
