import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Vouchers() {
  const { user, hasRole } = useAuth()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API endpoint
    const fetchVouchers = async () => {
      try {
        // This is a mock API call - replace with your actual API endpoint
        const response = await axios.get('https://api.example.com/vouchers')
        setVouchers(response.data)
      } catch (error) {
        console.error('Error fetching vouchers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVouchers()
  }, [])

  const handleApprove = async (voucherId) => {
    try {
      await axios.put(`https://api.example.com/vouchers/${voucherId}/approve`)
      // Refresh vouchers list
      const response = await axios.get('https://api.example.com/vouchers')
      setVouchers(response.data)
    } catch (error) {
      console.error('Error approving voucher:', error)
    }
  }

  const handlePay = async (voucherId) => {
    try {
      await axios.put(`https://api.example.com/vouchers/${voucherId}/pay`)
      // Refresh vouchers list
      const response = await axios.get('https://api.example.com/vouchers')
      setVouchers(response.data)
    } catch (error) {
      console.error('Error processing payment:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Vouchers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers.map((voucher) => (
          <div
            key={voucher.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {voucher.code}
            </h2>
            <p className="text-gray-600 mb-2">
              Amount: ${voucher.amount}
            </p>
            <p className="text-gray-600 mb-2">
              Created by: {voucher.createdBy}
            </p>
            <p className="text-gray-600 mb-4">
              Status: {voucher.status}
            </p>
            <div className="flex justify-between items-center">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  voucher.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : voucher.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : voucher.status === 'paid'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {voucher.status}
              </span>
              {hasRole('admin') && voucher.status === 'pending' && (
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  onClick={() => handleApprove(voucher.id)}
                >
                  Approve
                </button>
              )}
              {hasRole('accountant') && voucher.status === 'approved' && (
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  onClick={() => handlePay(voucher.id)}
                >
                  Process Payment
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Vouchers 