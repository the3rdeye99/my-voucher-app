'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import AdminSidebar from '../../components/AdminSidebar'
import { getVouchers } from '../../services/api'

export default function StaffDashboard() {
  const { user } = useAuth()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchVouchers()
    }
  }, [user])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const data = await getVouchers(user._id)
      setVouchers(data)
    } catch (error) {
      setError('Failed to fetch vouchers. Please try again later.')
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const pendingVouchers = vouchers.filter(voucher => voucher.status === 'pending')
  const approvedVouchers = vouchers.filter(voucher => voucher.status === 'approved')
  const paidVouchers = vouchers.filter(voucher => voucher.status === 'paid')

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="pt-24 px-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="pt-24 px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Staff Dashboard — Overview</h1>
        </div>

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
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                ⏳
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pending Vouchers</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? (
                    <span className="animate-pulse h-8 w-16 bg-gray-200 rounded block"></span>
                  ) : (
                    pendingVouchers.length
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                ✅
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
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Vouchers</h2>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...vouchers].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voucher.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voucher.purpose}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₦{voucher.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          voucher.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          voucher.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(voucher.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 