import axios from 'axios';

// Use environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, ''); // Remove trailing slashes

if (!API_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined in environment variables');
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
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
    // Get the current user from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('Please log in to create a voucher');
    }

    const user = JSON.parse(userStr);
    console.log('Current user data:', user);

    // Check if we have the organization ID
    if (!user.organization || !user.organization.id) {
      console.error('Organization data missing:', user.organization);
      throw new Error('Organization information not found. Please log in again.');
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
      staffName: user.name,
      organization: user.organization.id
    };

    console.log('Formatted voucher data being sent:', formattedData);
    const response = await api.post('/vouchers', formattedData, withRetry());
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
    console.log('Marking voucher as paid:', voucherId);
    const response = await api.put(`/vouchers/${voucherId}/pay`);
    console.log('[Voucher Marked as Paid]', response.data);
    return response.data;
  } catch (error) {
    console.error('Error marking voucher as paid:', {
      voucherId,
      error: error.message,
      response: error.response?.data
    });
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
    console.log('Current user data:', currentUser);

    // Check if we have the organization ID
    if (!currentUser.organization || !currentUser.organization.id) {
      console.error('Organization data missing:', currentUser.organization);
      throw new Error('Organization information not found. Please log in again.');
    }

    // Add organization ID to the user data
    const formattedData = {
      ...userData,
      organization: currentUser.organization.id // Pass only the ID
    };

    console.log('Creating user with data:', {
      ...formattedData,
      password: '[REDACTED]'
    });
    
    const response = await api.post('/users', formattedData, withRetry());
    console.log('User creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
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
  try {
    console.log('API: Fetching notifications');
    const response = await api.get('/notifications', withRetry());
    console.log('API: Notifications response:', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'Error fetching notifications');
    throw error;
  }
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