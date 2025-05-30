'use client'

import { useState, useMemo } from 'react'
import { rejectVoucher, markVoucherAsPaid } from '../../services/api'

export default function VouchersList({ vouchers, onApprove, onReject, user, onMarkAsPaid, showActions = true }) {
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false)

  // Filter vouchers based on user role and sort by date
  const filteredVouchers = useMemo(() => {
    let filtered = vouchers;
    
    if (user) {
      if (user.role === 'admin' || user.role === 'accountant') {
        filtered = vouchers; // Admin and accountants can see all vouchers
      } else {
        filtered = vouchers.filter(voucher => voucher.staffId === user.id);
      }
    }
    
    // Sort by date in descending order (newest first)
    return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [vouchers, user]);

  const handleReject = async (voucherId) => {
    try {
      setIsRejecting(true)
      await rejectVoucher(voucherId)
      // Refresh the vouchers list
      window.location.reload()
    } catch (error) {
      console.error('Error rejecting voucher:', error)
      alert('Failed to reject voucher. Please try again.')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleMarkAsPaid = async (voucherId) => {
    try {
      setIsMarkingAsPaid(true)
      await markVoucherAsPaid(voucherId)
      // Refresh the vouchers list
      window.location.reload()
    } catch (error) {
      console.error('Error marking voucher as paid:', error)
      alert('Failed to mark voucher as paid. Please try again.')
    } finally {
      setIsMarkingAsPaid(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'paid':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount) => {
    return `₦${amount.toLocaleString()}`
  }

  if (filteredVouchers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No vouchers found.
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVouchers.map((voucher) => (
              <tr key={voucher.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voucher.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voucher.staffName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voucher.purpose}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatAmount(voucher.amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(voucher.status)}`}>
                    {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(voucher.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedVoucher(voucher)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    {user?.role === 'admin' && voucher.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(voucher.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(voucher.id)}
                          disabled={isRejecting}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRejecting ? 'Rejecting...' : 'Reject'}
                        </button>
                      </>
                    )}
                    {user?.role === 'accountant' && voucher.status === 'approved' && (
                      <button
                        onClick={() => handleMarkAsPaid(voucher.id)}
                        disabled={isMarkingAsPaid}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isMarkingAsPaid ? 'Processing...' : 'Mark as Paid'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Voucher Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Voucher Details</h3>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Purpose</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedVoucher.purpose}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedVoucher.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                <p className="mt-1 text-sm text-gray-900">{formatAmount(selectedVoucher.amount)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Requested By</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedVoucher.staffName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date Needed</h4>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedVoucher.neededBy)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedVoucher.status)}`}>
                    {selectedVoucher.status.charAt(0).toUpperCase() + selectedVoucher.status.slice(1)}
                  </span>
                </p>
              </div>
              {selectedVoucher.file && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                  <a
                    href="#"
                    className="mt-1 text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    {selectedVoucher.file}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 