'use client'

import { useState } from 'react'
import { markVoucherAsPaid } from '../../services/api'

export default function VoucherCard({ voucher, onMarkAsPaid }) {
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleMarkAsPaid = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await markVoucherAsPaid(voucher.id)
      onMarkAsPaid(voucher.id)
    } catch (err) {
      setError('Failed to mark voucher as paid. Please try again.')
      console.error('Error marking voucher as paid:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Voucher ID</div>
            <div className="font-semibold text-gray-900">#{voucher.id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Amount</div>
            <div className="font-semibold text-gray-900">₦{voucher.amount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Title</div>
            <div className="font-semibold text-gray-900">{voucher.purpose}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Requested by</div>
            <div className="font-semibold text-gray-900">{voucher.staffName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Date Needed</div>
            <div className="font-semibold text-gray-900">{formatDate(voucher.neededBy)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Approved
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => setShowDetails(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            View Details
          </button>
          <button
            onClick={handleMarkAsPaid}
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Mark as Paid'}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Voucher Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Voucher Details</h3>
              <button
                onClick={() => setShowDetails(false)}
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
                <h4 className="text-sm font-medium text-gray-500">Voucher ID</h4>
                <p className="mt-1 text-sm text-gray-900">#{voucher.id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Purpose</h4>
                <p className="mt-1 text-sm text-gray-900">{voucher.purpose}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-sm text-gray-900">{voucher.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                <p className="mt-1 text-sm text-gray-900">₦{voucher.amount.toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Requested By</h4>
                <p className="mt-1 text-sm text-gray-900">{voucher.staffName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date Needed</h4>
                <p className="mt-1 text-sm text-gray-900">{formatDate(voucher.neededBy)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="mt-1 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ Approved
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 