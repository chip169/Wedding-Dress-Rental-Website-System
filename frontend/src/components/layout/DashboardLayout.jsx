import React from 'react';
import AdminLayout from './AdminLayout';

export default function DashboardLayout({
  role = 'staff',
  children,
  controls,
  title,
  subtitle,
  activeNav
}) {
  return (
    <AdminLayout
      role={role}
      controls={controls}
      title={title}
      subtitle={subtitle}
      activeMenu={activeNav}
    >
      {children}
    </AdminLayout>
  );
}
