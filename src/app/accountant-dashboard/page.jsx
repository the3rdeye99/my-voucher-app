'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import AdminSidebar from '../../components/AdminSidebar'
import VouchersList from '../../components/admin/VouchersList'
import { getVouchers, approveVoucher } from '../../services/api'

export default function AccountantDashboard() {
  const { user } = useAuth()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

          {/* Vouchers List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Vouchers</h2>
            </div>
            <VouchersList
              vouchers={vouchers.slice(0, 5)}
              onApproveVoucher={handleApproveVoucher}
              showActions={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 