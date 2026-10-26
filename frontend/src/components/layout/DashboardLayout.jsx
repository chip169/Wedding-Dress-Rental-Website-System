import React from 'react';
import AdminLayout from './AdminLayout';

export default function DashboardLayout({
  role = 'admin',
  children,
  controls,
  title = 'Tổng Quan',
  subtitle = 'Tổng quan các số liệu',
  activeNav
}) {
  return (
    <AdminLayout
      role={role}
      title={title}
      subtitle={subtitle}
      controls={controls}
    >
      {children}
    </AdminLayout>
  );
}
