'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import AdminSidebar from '../../../components/AdminSidebar'
import VouchersList from '../../../components/admin/VouchersList'
import { getVouchers, approveVoucher, exportVouchers } from '../../../services/api'

export default function AccountantVouchers() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const data = await getVouchers()
      setVouchers(data)
    } catch (error) {
      setError('Failed to fetch vouchers. Please try again later.')
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveVoucher = async (voucherId) => {
    try {
      await approveVoucher(voucherId)
      // Refresh the vouchers list
      await fetchVouchers()
    } catch (error) {
      console.error('Error approving voucher:', error)
    }
  }

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesStatus = statusFilter === 'all' ? true : voucher.status === statusFilter
    const matchesSearch = searchQuery === '' ? true : 
      voucher.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await exportVouchers({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined
      })
    } catch (error) {
      console.error('Error exporting vouchers:', error)
      alert('Failed to export vouchers. Please try again.')
    } finally {
      setIsExporting(false)
    }
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
      
      <main className="pt-24 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">📋 Vouchers Page</h2>
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
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>

            <VouchersList
              vouchers={filteredVouchers}
              user={user}
              onApproveVoucher={handleApproveVoucher}
              showActions={true}
            />
          </div>
        </div>
      </main>
    </div>
  )
} 