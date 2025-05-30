import axios from 'axios';

// Use environment variable for API URL with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout to 15 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add axios interceptor for authentication and retry logic
api.interceptors.request.use(
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

// Add response interceptor for error handling and retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // If no config or already retried, reject
    if (!config || !config.retry) {
      return Promise.reject(error);
    }

    // Set retry count
    config.retryCount = config.retryCount || 0;

    // Check if we should retry
    if (config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      
      // Log retry attempt
      console.log(`Retrying request (${config.retryCount}/${MAX_RETRIES}): ${config.url}`);
      
      // Wait before retrying
      await wait(RETRY_DELAY * config.retryCount);
      
      // Retry the request
      return api(config);
    }

    // Handle unauthorized access
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Add logging function
const logError = (error, context) => {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
  console.error('Error details:', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    config: {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    }
  });
};

// Helper function to add retry config to requests
const withRetry = (config = {}) => ({
  ...config,
  retry: true
});

export const getVouchers = async (userId = null) => {
  try {
    // Get the current user from localStorage
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    
    // If no userId provided and user is not admin/accountant, use current user's ID
    const staffId = !userId && currentUser?.role === 'staff' ? currentUser.id : userId;
    
    console.log('API: Fetching vouchers', staffId ? `for user ${staffId}` : 'for all users');
    const response = await api.get(`/vouchers${staffId ? `?staffId=${staffId}` : ''}`, withRetry());
    console.log('API: Vouchers response:', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'Error fetching vouchers');
    throw error;
  }
};

export const getUsers = async () => {
  try {
    console.log('API: Fetching users');
    const response = await api.get('/users', withRetry());
    console.log('API: Users response:', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'Error fetching users');
    throw error;
  }
};

export const createVoucher = async (voucherData) => {
  try {
    console.log('Raw voucher data received:', voucherData);
    
    // Get the current user from localStorage
    const userStr = localStorage.getItem('user');
    console.log('User data from localStorage:', userStr);
    
    if (!userStr) {
      throw new Error('Please log in to create a voucher');
    }

    const user = JSON.parse(userStr);
    console.log('Parsed user data:', user);
    
    if (!user || !user.id) {
      throw new Error('Invalid user session. Please log in again.');
    }

    // Validate required fields
    const requiredFields = ['purpose', 'amount', 'description', 'neededBy'];
    const missingFields = requiredFields.filter(field => !voucherData[field]);
    console.log('Checking required fields:', {
      requiredFields,
      missingFields,
      voucherData
    });
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Format the data
    const formattedData = {
      purpose: voucherData.purpose.trim(),
      amount: parseFloat(voucherData.amount),
      description: voucherData.description.trim(),
      neededBy: new Date(voucherData.neededBy).toISOString(),
      staffId: user.id,
      staffName: voucherData.staffName.trim(),
      organization: user.organization || user.organizationName
    };

    console.log('Formatted voucher data being sent:', formattedData);
    const response = await api.post('/vouchers', formattedData);
    console.log('Voucher creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in createVoucher:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.message.includes('log in')) {
      throw error;
    }
    throw new Error('Failed to create voucher. Please try again.');
  }
};

export const approveVoucher = async (voucherId) => {
  try {
    const response = await api.put(`/vouchers/${voucherId}/approve`);
    console.log('[Voucher Approved]', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'Error approving voucher');
    throw error;
  }
};

export const rejectVoucher = async (voucherId) => {
  try {
    const response = await api.put(`/vouchers/${voucherId}/reject`);
    console.log('[Voucher Rejected]', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'Error rejecting voucher');
    throw error;
  }
};

export const markVoucherAsPaid = async (voucherId) => {
  try {
    const response = await api.put(`/vouchers/${voucherId}/pay`);
    console.log('[Voucher Marked as Paid]', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'Error marking voucher as paid');
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    // Get the current user from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('Please log in to create a user');
    }

    const currentUser = JSON.parse(userStr);
    if (!currentUser || !currentUser.organization || !currentUser.organization._id) {
      throw new Error('Organization information not found. Please log in again.');
    }

    // Add organization to the user data
    const formattedData = {
      ...userData,
      organization: currentUser.organization._id
    };

    console.log('Creating user with data:', formattedData);
    const response = await api.post('/users', formattedData);
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
    const response = await api.delete(`/users/${userId}`);
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

export const clearAllNotifications = async () => {
  const response = await fetch(`${API_URL}/notifications/clear-all`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to clear notifications');
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

export const exportVouchers = async (data) => {
  try {
    const response = await fetch(`${API_URL}/vouchers/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to export vouchers');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error exporting vouchers:', error);
    throw new Error(error.message || 'Failed to export vouchers');
  }
};

export const updateUser = async (userData) => {
  try {
    const response = await api.put(`/users/${userData.id}`, userData);
    return response.data;
  } catch (error) {
    logError(error, 'Error updating user');
    throw error;
  }
}; 