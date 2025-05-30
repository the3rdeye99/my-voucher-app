import { useState } from 'react';
import { BellIcon, TrashIcon } from '@heroicons/react/24/outline';
import { clearAllNotifications } from '../services/api';

const Notification = ({ notifications, onMarkAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      // Clear notifications locally instead of reloading
      notifications.length = 0;
      // Close the notification panel
      setIsOpen(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border border-gray-700">
          <div className="p-2 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-medium text-white">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1 text-gray-400 hover:text-white focus:outline-none"
                title="Clear all notifications"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-400">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`px-4 py-2 hover:bg-gray-700 cursor-pointer ${
                    !notification.read ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => onMarkAsRead(notification._id)}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-300">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="ml-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification; 