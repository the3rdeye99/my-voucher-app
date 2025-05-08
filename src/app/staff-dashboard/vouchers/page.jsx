'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import AdminSidebar from '../../../components/AdminSidebar'
import VouchersList from '../../../components/admin/VouchersList'
import { getVouchers } from '../../../services/api'

function StaffVouchers() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesStatus = statusFilter === 'all' ? true : voucher.status === statusFilter
    const matchesSearch = searchQuery === '' ? true : 
      voucher.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

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
      
      <main className="pt-24 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">📋 My Vouchers</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full sm:w-40 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
                <input
                  type="text"
                  placeholder="Search vouchers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>

            <VouchersList
              vouchers={filteredVouchers}
              showActions={false}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default StaffVouchers 