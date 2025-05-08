import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Mock data for vouchers
const initialVouchers = [
  {
    id: 'V001',
    staffName: 'John Doe',
    amount: 500,
    status: 'Approved',
    date: '2024-03-15'
  },
  {
    id: 'V002',
    staffName: 'Jane Smith',
    amount: 1200,
    status: 'Approved',
    date: '2024-03-14'
  },
  {
    id: 'V003',
    staffName: 'Mike Johnson',
    amount: 2500,
    status: 'Paid',
    date: '2024-03-10'
  },
  {
    id: 'V004',
    staffName: 'Sarah Wilson',
    amount: 800,
    status: 'Paid',
    date: '2024-03-08'
  }
]

function AccountantDashboard() {
  const { user } = useAuth()
  const [vouchers, setVouchers] = useState(initialVouchers)

  const handleMarkAsPaid = (voucherId) => {
    setVouchers(vouchers.map(voucher => 
      voucher.id === voucherId ? { ...voucher, status: 'Paid' } : voucher
    ))
  }

  const approvedVouchers = vouchers.filter(voucher => voucher.status === 'Approved')
  const paidVouchers = vouchers.filter(voucher => voucher.status === 'Paid')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Accountant Dashboard</h1>

      {/* Approved Vouchers */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">✅ Approved Vouchers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedVouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {voucher.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {voucher.staffName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${voucher.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleMarkAsPaid(voucher.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Pay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paid Vouchers */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">💰 Paid Vouchers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paidVouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {voucher.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {voucher.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${voucher.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-red-600 hover:text-red-900">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AccountantDashboard 