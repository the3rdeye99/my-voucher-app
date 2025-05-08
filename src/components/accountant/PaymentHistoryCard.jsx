'use client'

export default function PaymentHistoryCard({ payment }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-semibold text-gray-900">Voucher #{payment.id}</span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="font-semibold text-gray-900">₦{payment.amount.toLocaleString()}</span>
          </div>
          <div className="text-sm text-gray-500">
            Paid on: {formatDate(payment.paidDate)}
          </div>
        </div>
        
        <div className="text-gray-600">
          Details: {payment.purpose}
        </div>
        
        <div className="flex justify-between text-sm text-gray-500">
          <div>Paid By: {payment.paidBy}</div>
          <div>Date Needed: {formatDate(payment.neededBy)}</div>
        </div>
      </div>
    </div>
  )
} 