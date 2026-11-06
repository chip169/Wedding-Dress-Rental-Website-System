import axiosClient from '../api/axiosClient';

// Dashboard operations must report server failures instead of using demo data.
export async function getStaffAppointments() {
  const response = await axiosClient.get('/staff/dashboard/appointments');
  if (!response?.success || !Array.isArray(response.data)) {
    throw new Error(response?.message || 'Không thể tải danh sách lịch hẹn.');
  }
  return response.data;
}

export async function updateStaffAppointmentStatus(id, status) {
  const response = await axiosClient.patch(`/appointments/${encodeURIComponent(id)}/status`, { status });
  if (!response?.success || !response.data) {
    throw new Error(response?.message || 'Không thể cập nhật trạng thái lịch hẹn.');
  }
  return response.data;
}
