import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Add axios interceptor for authentication
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add logging function
const logError = (error, context) => {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
  console.error('Error details:', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data
  });
};

export const getVouchers = async (userId = null) => {
  try {
    const response = await axios.get(`${API_URL}/vouchers${userId ? `?userId=${userId}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  } catch (error) {
    logError(error, 'Error fetching users');
    throw error;
  }
};

export const createVoucher = async (voucherData) => {
  try {
    const response = await axios.post(`${API_URL}/vouchers`, voucherData);
    console.log('[Voucher Created]', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'Error creating voucher');
    throw error;
  }
};

export const approveVoucher = async (voucherId) => {
  try {
    const response = await axios.put(`${API_URL}/vouchers/${voucherId}/approve`);
    console.log('[Voucher Approved]', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'Error approving voucher');
    throw error;
  }
};

export const markAsPaid = async (voucherId) => {
  try {
    const response = await axios.put(`${API_URL}/vouchers/${voucherId}/pay`);
    console.log('[Voucher Marked as Paid]', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'Error marking voucher as paid');
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users`, userData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    logError(error, 'Error creating user');
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    logError(error, 'Error deleting user');
    throw error;
  }
};

// Notification API functions
export const getNotifications = async () => {
  const response = await fetch(`${API_URL}/notifications`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
  return response.json();
};

export const createNotification = async (notification) => {
  const response = await fetch(`${API_URL}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(notification)
  });
  if (!response.ok) {
    throw new Error('Failed to create notification');
  }
  return response.json();
}; 