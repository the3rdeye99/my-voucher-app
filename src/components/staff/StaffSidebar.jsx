import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaHome, FaFileInvoiceDollar, FaBell, FaCog, FaSignOutAlt, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { getNotifications, markNotificationAsRead } from '@/services/api';
import { playNotificationSound, setNotificationSoundEnabled, isNotificationSoundEnabled } from '@/utils/notificationSound';

export default function StaffSidebar({ user }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotificationIds, setLastNotificationIds] = useState(new Set());

  useEffect(() => {
    // Initialize sound preference
    setSoundEnabled(isNotificationSoundEnabled());
    
    // Fetch notifications immediately
    fetchNotifications();
    
    // Set up polling for notifications
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      
      // Check for new notifications
      const currentIds = new Set(data.map(n => n._id));
      const hasNewNotifications = data.some(notification => !lastNotificationIds.has(notification._id));
      
      if (hasNewNotifications && soundEnabled) {
        console.log('New notifications detected, playing sound...');
        playNotificationSound();
      }
      
      setNotifications(data);
      setLastNotificationIds(currentIds);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await markNotificationAsRead(notification._id);
      setNotifications(notifications.map(n => 
        n._id === notification._id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    setNotificationSoundEnabled(newState);
  };

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Staff Dashboard</h2>
        <p className="text-sm text-gray-400">{user?.name}</p>
      </div>

      <nav>
        <Link href="/staff-dashboard" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded">
          <FaHome />
          <span>Home</span>
        </Link>
        <Link href="/staff-dashboard/my-vouchers" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded">
          <FaFileInvoiceDollar />
          <span>My Vouchers</span>
        </Link>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-700 rounded relative"
        >
          <FaBell />
          <span>Notifications</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="absolute right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
        <Link href="/staff-dashboard/settings" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded">
          <FaCog />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            router.push('/login');
          }}
          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-700 rounded text-red-400"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </nav>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            <button
              onClick={toggleSound}
              className="p-2 text-gray-600 hover:text-gray-800"
              title={soundEnabled ? "Disable notification sound" : "Enable notification sound"}
            >
              {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-gray-800">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 