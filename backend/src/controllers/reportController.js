import * as report from '../services/reportService.js';
import * as adminReport from '../services/adminReportService.js';

export const staffDashboard = async (req, res) => res.json({
  success: true,
  message: 'Lấy báo cáo tổng quan nhân viên thành công.',
  data: await report.dashboard('STAFF', req.query.period),
});

export const staffAppointments = async (req, res) => res.json({
  success: true,
  message: 'Lấy lịch hẹn hôm nay và sắp tới thành công.',
  data: await report.upcomingStaffAppointments(),
});

export const adminDashboard = async (req, res) => res.json({
  success: true,
  message: 'Lấy báo cáo tổng quan quản trị thành công.',
  data: await adminReport.dashboard(req.query.period),
});

export const revenue = async (req, res) => res.json({
  success: true,
  message: 'Lấy báo cáo doanh thu thành công.',
  data: await adminReport.revenueReport(req.query.period),
});
