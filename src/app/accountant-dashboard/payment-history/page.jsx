'use client'

import { useState, useEffect } from 'react'
import AccountantNavbar from '../../../components/AccountantNavbar'
import { getVouchers } from '../../../services/api'

export default function PaymentHistory() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const data = await getVouchers()
      // Filter for paid vouchers
      const paidVouchers = data.filter(voucher => voucher.status === 'paid')
      setVouchers(paidVouchers)
    } catch (error) {
      setError('Failed to fetch payment history. Please try again later.')
      console.error('Error fetching payment history:', error)
    } finally {
      setLoading(false)
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

  const totalAmountPaid = filteredVouchers.reduce((sum, voucher) => sum + voucher.amount, 0)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'N/A'
    }
  }

  const getDatePart = (formattedDate) => {
    if (!formattedDate || formattedDate === 'N/A' || formattedDate === 'Invalid Date') return 'N/A'
    const parts = formattedDate.split(',')
    return parts[0] || 'N/A'
  }

  const getTimePart = (formattedDate) => {
    if (!formattedDate || formattedDate === 'N/A' || formattedDate === 'Invalid Date') return 'N/A'
    const parts = formattedDate.split(',')
    return parts[1] ? parts[1].trim() : 'N/A'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AccountantNavbar />
      
      <div className="pt-20 px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Payment History</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all vouchers that have been marked as paid
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              💰
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Amount Paid</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <span className="animate-pulse h-8 w-24 bg-gray-200 rounded block"></span>
                ) : (
                  `₦${totalAmountPaid.toLocaleString()}`
                )}
              </p>
            </div>
          </div>
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
                placeholder="Search by purpose or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Vouchers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voucher ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVouchers.map((voucher) => (
                    <tr key={voucher.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {voucher.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {voucher.staffName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {voucher.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₦{voucher.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getDatePart(formatDate(voucher.updatedAt))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getTimePart(formatDate(voucher.updatedAt))}
                      </td>
                    </tr>
                  ))}
                  {filteredVouchers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No payment history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 