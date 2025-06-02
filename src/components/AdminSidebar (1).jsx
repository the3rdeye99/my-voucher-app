'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import Notification from './Notification'
import { getNotifications, markNotificationAsRead } from '../services/api'

export default function AdminSidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [notifications, setNotifications] = useState([])

  const isActive = (path) => {
    if (!pathname) return false
    return pathname === path
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin-dashboard'
      case 'accountant':
        return '/accountant-dashboard'
      case 'staff':
        return '/staff-dashboard'
      default:
        return '/dashboard'
    }
  }

  const getVouchersPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin-dashboard/vouchers'
      case 'accountant':
        return '/accountant-dashboard/vouchers'
      case 'staff':
        return '/staff-dashboard/vouchers'
      default:
        return '/vouchers'
    }
  }

  const getPanelTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'Admin Panel'
      case 'accountant':
        return 'Accountant Panel'
      case 'staff':
        return 'Staff Panel'
      default:
        return 'Dashboard'
    }
  }

  return (
    <div className="w-full bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="text-xl font-bold">
              {getPanelTitle()}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Notification 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
            />
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-white">{user?.name}</span>
                  <span className="text-sm text-gray-300">({user?.role})</span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${
                    isDropdownOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-700">
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-gray-400">{user?.email}</div>
                  </div>
                  <Link
                    href={getDashboardPath()}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isActive(getDashboardPath())
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={getVouchersPath()}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isActive(getVouchersPath())
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Vouchers
                  </Link>
                  {user?.role === 'staff' && (
                    <Link
                      href="/staff-dashboard/create-voucher"
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        isActive('/staff-dashboard/create-voucher')
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Create Voucher
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin-dashboard/users"
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        isActive('/admin-dashboard/users')
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      User Management
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 border-t border-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 