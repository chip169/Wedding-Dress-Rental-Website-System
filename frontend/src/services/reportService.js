import axiosClient from '../api/axiosClient';

export const getStaffDashboard = async (period) => (await axiosClient.get('/staff/dashboard', { params: { period } })).data;
export const getAdminDashboard = async (period) => (await axiosClient.get('/admin/dashboard', { params: { period } })).data;
export const getRevenueReport = async (period) => (await axiosClient.get('/admin/revenue', { params: { period } })).data;
