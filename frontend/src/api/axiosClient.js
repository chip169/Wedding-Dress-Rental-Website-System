import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor tự động gán JWT Token hoặc Guest Session ID từ localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    let guestSessionId = localStorage.getItem('unibridal_guest_session_id');
    if (!guestSessionId) {
      guestSessionId = 'guest_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      localStorage.setItem('unibridal_guest_session_id', guestSessionId);
    }
    config.headers['x-guest-session-id'] = guestSessionId;

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor xử lý phản hồi từ server
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      success: false,
      message: error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ',
      status: error.response?.status,
    };
    return Promise.reject(customError);
  }
);

export default axiosClient;
