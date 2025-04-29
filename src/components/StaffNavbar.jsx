'use client'

import Link from 'next/link'
import StaffDropdown from './StaffDropdown'

export default function StaffNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/staff-dashboard" className="text-xl font-bold text-red-600">
              KFC Voucher
            </Link>
          </div>
          <div className="flex items-center">
            <StaffDropdown />
          </div>
        </div>
      </div>
    </nav>
  )
} 