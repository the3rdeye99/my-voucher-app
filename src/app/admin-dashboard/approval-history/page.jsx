'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import AdminSidebar from '../../../components/AdminSidebar'
import { getVouchers } from '../../../services/api'

export default function ApprovalHistory() {
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

  const approvedVouchers = vouchers.filter(voucher => voucher.status === 'approved')
  const paidVouchers = vouchers.filter(voucher => voucher.status === 'paid')

  const formatAmount = (amount) => {
    return `₦${amount.toLocaleString()}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <h1 className="text-2xl font-semibold text-gray-900">Approval & Payment History</h1>
            <p className="text-sm text-gray-500">
              View all approved and paid vouchers in the system
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  <h3 className="text-sm font-medium text-gray-500">Paid Vouchers</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? (
                      <span className="animate-pulse h-8 w-16 bg-gray-200 rounded block"></span>
                    ) : (
                      paidVouchers.length
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Approved Vouchers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Approved Vouchers</h2>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvedVouchers.map((voucher) => (
                      <tr key={voucher.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voucher.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatAmount(voucher.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voucher.approvedBy || 'Admin'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(voucher.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paid Vouchers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Paid Vouchers</h2>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paidVouchers.map((voucher) => (
                      <tr key={voucher.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voucher.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatAmount(voucher.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voucher.paidBy || 'Admin'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(voucher.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 