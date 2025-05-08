'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

export default function AccountantSidebar({ activeSection, setActiveSection }) {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <div className="w-full bg-white fixed top-0 left-0 border-b border-gray-200 z-10">
      <div className="p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-8">
            <Link href="/accountant-dashboard" className="text-xl font-semibold text-gray-800">
              KFC Voucher
            </Link>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <Link
                    href="/accountant-dashboard"
                    className={`px-4 py-2 rounded-md ${
                      pathname === '/accountant-dashboard'
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/accountant-dashboard/vouchers"
                    className={`px-4 py-2 rounded-md ${
                      pathname === '/accountant-dashboard/vouchers'
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Vouchers
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-gray-600 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
} 