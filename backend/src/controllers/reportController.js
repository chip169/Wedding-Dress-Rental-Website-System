import * as report from '../services/reportService.js';

export const staffDashboard = async (req, res) => res.json({ success: true, message: 'Lấy tổng quan nhân viên thành công.', data: await report.dashboard('STAFF', req.query.period) });
export const adminDashboard = async (req, res) => res.json({ success: true, message: 'Lấy tổng quan quản trị thành công.', data: await report.dashboard('ADMIN', req.query.period) });
export const revenue = async (req, res) => res.json({ success: true, message: 'Lấy báo cáo doanh thu thành công.', data: await report.revenueReport(req.query.period) });
