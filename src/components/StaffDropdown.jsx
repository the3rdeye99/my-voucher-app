'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'

export default function StaffDropdown() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          <span className="text-sm text-gray-500">({user?.role})</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
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
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            <div className="font-medium">{user?.name}</div>
            <div className="text-gray-500">{user?.email}</div>
          </div>
          <Link
            href="/staff-dashboard"
            className={`block w-full text-left px-4 py-2 text-sm ${
              isActive('/staff-dashboard')
                ? 'bg-red-50 text-red-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/staff-dashboard/create-voucher"
            className={`block w-full text-left px-4 py-2 text-sm ${
              isActive('/staff-dashboard/create-voucher')
                ? 'bg-red-50 text-red-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Create Voucher
          </Link>
          <Link
            href="/staff-dashboard/my-vouchers"
            className={`block w-full text-left px-4 py-2 text-sm ${
              isActive('/staff-dashboard/my-vouchers')
                ? 'bg-red-50 text-red-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            My Vouchers
          </Link>
          <button
            onClick={logout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
} 