'use client'

import { useState } from 'react'
import AccountantNavbar from '../../components/AccountantNavbar'
import PaymentHistoryCard from '../../components/accountant/PaymentHistoryCard'

export default function PaymentHistory() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [payments, setPayments] = useState([
    {
      id: '2025-0227',
      amount: 85000,
      purpose: 'Printer purchase for legal dept.',
      paidBy: 'John Doe',
      paidDate: '2025-03-28',
      neededBy: '2025-03-25'
    },
    {
      id: '2025-0228',
      amount: 120000,
      purpose: 'Office supplies for HR department',
      paidBy: 'Jane Smith',
      paidDate: '2025-03-29',
      neededBy: '2025-03-26'
    }
  ])

  return (
    <div className="min-h-screen bg-gray-100">
      <AccountantNavbar />
      
      <div className="pt-20 px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">📂 Payment History</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">📅</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                placeholder="Start Date"
              />
              <span className="text-gray-500">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                placeholder="End Date"
              />
            </div>
            <div className="col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">🔍</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Search by voucher ID or description"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {payments.map(payment => (
            <PaymentHistoryCard
              key={payment.id}
              payment={payment}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 