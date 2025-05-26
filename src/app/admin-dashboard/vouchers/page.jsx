'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '../../../components/AdminSidebar'
import VouchersList from '../../../components/admin/VouchersList'
import { getVouchers, approveVoucher, exportVouchers, rejectVoucher } from '../../../services/api'

export default function AdminVouchers() {
  const [activeSection, setActiveSection] = useState('vouchers')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [user, setUser] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchVouchers()
      // Set up polling every 5 seconds for real-time updates
      const interval = setInterval(fetchVouchers, 5000)
      return () => clearInterval(interval)
    }
  }, [user, statusFilter, searchQuery, startDate, endDate])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const data = await getVouchers()
      setVouchers(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (error) {
      console.error('Error fetching vouchers:', error)
      setError('Failed to fetch vouchers')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (voucherId) => {
    try {
      await approveVoucher(voucherId)
      // Fetch vouchers immediately after approval
      await fetchVouchers()
    } catch (error) {
      console.error('Error approving voucher:', error)
      setError('Failed to approve voucher')
    }
  }

  const handleReject = async (voucherId) => {
    try {
      await rejectVoucher(voucherId)
      // Fetch vouchers immediately after rejection
      await fetchVouchers()
    } catch (error) {
      console.error('Error rejecting voucher:', error)
      setError('Failed to reject voucher')
    }
  }

  const formatAmount = (amount) => {
    return `₦${amount.toLocaleString()}`
  }

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesStatus = statusFilter === 'all' || voucher.status === statusFilter
    const matchesSearch = !searchQuery || 
      voucher.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.staffName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDate = (!startDate || new Date(voucher.date) >= new Date(startDate)) && 
                       (!endDate || new Date(voucher.date) <= new Date(endDate))
    return matchesStatus && matchesSearch && matchesDate
  })

  const totalAmountPaid = filteredVouchers
    .filter(voucher => voucher.status === 'paid')
    .reduce((sum, voucher) => sum + voucher.amount, 0)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const exportData = {
        vouchers: filteredVouchers,
        summary: {
          totalAmountPaid,
          totalVouchers: filteredVouchers.length,
          paidVouchers: filteredVouchers.filter(v => v.status === 'paid').length,
          dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
          exportDate: new Date().toLocaleString()
        }
      }
      await exportVouchers(exportData)
    } catch (error) {
      console.error('Error exporting vouchers:', error)
      setError('Failed to export vouchers')
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

            {/* Total Amount Summary */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Total Amount Paid</h3>
                  <p className="text-sm text-gray-500">
                    {startDate && endDate 
                      ? `From ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
                      : 'All time'}
                  </p>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatAmount(totalAmountPaid)}
                </p>
              </div>
            </div>

            {/* Date Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>

            <VouchersList
              vouchers={filteredVouchers}
              user={user}
              onApprove={handleApprove}
              onReject={handleReject}
              showActions={true}
            />
          </div>
        </div>
      </main>
    </div>
  )
} 