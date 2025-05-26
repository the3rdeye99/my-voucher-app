'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import AdminSidebar from '../../components/AdminSidebar'
import VouchersList from '../../components/admin/VouchersList'
import { getVouchers, approveVoucher } from '../../services/api'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function AccountantDashboard() {
  const { user } = useAuth()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMonthlyTotalModal, setShowMonthlyTotalModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const vouchersData = await getVouchers()
      setVouchers(vouchersData)
    } catch (error) {
      setError('Failed to fetch data. Please try again later.')
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveVoucher = async (voucherId) => {
    try {
      await approveVoucher(voucherId)
      // Refresh the vouchers list
      await fetchData()
    } catch (error) {
      console.error('Error approving voucher:', error)
    }
  }

  const approvedVouchers = vouchers.filter(voucher => voucher.status === 'approved')
  const paidVouchers = vouchers.filter(voucher => voucher.status === 'paid')
  const pendingVouchers = vouchers.filter(voucher => voucher.status === 'pending')

  const formatAmount = (amount) => {
    return `₦${amount.toLocaleString()}`
  }

  const totalAmountPending = approvedVouchers.reduce((sum, voucher) => sum + voucher.amount, 0)

  // Calculate monthly total
  const getMonthlyTotal = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    return paidVouchers
      .filter(voucher => {
        const voucherDate = new Date(voucher.date)
        return voucherDate.getMonth() === currentMonth && voucherDate.getFullYear() === currentYear
      })
      .reduce((sum, voucher) => sum + voucher.amount, 0)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar />
        <main className="pt-24 p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              Manage vouchers in the system
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  📋
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Vouchers</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? (
                      <span className="animate-pulse h-8 w-16 bg-gray-200 rounded block"></span>
                    ) : (
                      vouchers.length
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  ✓
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Approved Vouchers</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? (
                      <span className="animate-pulse h-8 w-16 bg-gray-200 rounded block"></span>
                    ) : (
                      approvedVouchers.length
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  💰
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Amount Pending</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? (
                      <span className="animate-pulse h-8 w-16 bg-gray-200 rounded block"></span>
                    ) : (
                      formatAmount(totalAmountPending)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Total Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowMonthlyTotalModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              View Monthly Total
            </button>
          </div>

          {/* Vouchers List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Vouchers</h2>
            </div>
            <VouchersList
              vouchers={[...vouchers].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)}
              onApproveVoucher={handleApproveVoucher}
              showActions={true}
            />
          </div>
        </div>
      </div>

      {/* Monthly Total Modal */}
      {showMonthlyTotalModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Payment Summary</h3>
              <button
                onClick={() => setShowMonthlyTotalModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500">Current Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Total Amount Paid</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatAmount(getMonthlyTotal())}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Number of Paid Vouchers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {paidVouchers.filter(voucher => {
                    const voucherDate = new Date(voucher.date)
                    const currentDate = new Date()
                    return voucherDate.getMonth() === currentDate.getMonth() && 
                           voucherDate.getFullYear() === currentDate.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
              <button
                onClick={() => setShowMonthlyTotalModal(false)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 