'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '../../../components/AdminSidebar'
import VouchersList from '../../../components/admin/VouchersList'
import { getVouchers, approveVoucher } from '../../../services/api'

export default function AdminVouchers() {
  const [activeSection, setActiveSection] = useState('vouchers')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting vouchers...')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
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
      <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <main className="pt-24 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">📋 Vouchers Page</h2>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>

              <input
                type="text"
                placeholder="Search Voucher"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              <button
                onClick={handleExport}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Export
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <VouchersList
                vouchers={filteredVouchers}
                onApprove={handleApproveVoucher}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 