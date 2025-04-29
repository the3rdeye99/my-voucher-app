'use client'

import { useState, useEffect } from 'react'
import AccountantNavbar from '../../../components/AccountantNavbar'
import VoucherCard from '../../../components/accountant/VoucherCard'
import { getVouchers, markVoucherAsPaid } from '../../../services/api'

export default function ApprovedVouchers() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
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
      // Filter for approved vouchers
      const approvedVouchers = data.filter(voucher => voucher.status === 'approved')
      setVouchers(approvedVouchers)
    } catch (error) {
      setError('Failed to fetch vouchers. Please try again later.')
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (voucherId) => {
    try {
      await markVoucherAsPaid(voucherId)
      // Refresh the vouchers list
      await fetchVouchers()
    } catch (error) {
      console.error('Error marking voucher as paid:', error)
    }
  }

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesDate = (!startDate || voucher.date >= startDate) && 
                       (!endDate || voucher.date <= endDate)
    const matchesSearch = !searchQuery || 
      voucher.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.staffName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesDate && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-100">
      <AccountantNavbar />
      
      <div className="pt-20 px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Accountant Dashboard — Approved Vouchers</h1>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                placeholder="Search vouchers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVouchers.map(voucher => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                onMarkAsPaid={handleMarkAsPaid}
              />
            ))}
            {filteredVouchers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No approved vouchers found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 