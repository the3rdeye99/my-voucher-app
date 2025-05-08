'use client'

import { useState } from 'react'
import AdminSidebar from '../../../components/AdminSidebar'
import CreateVoucher from '../../../components/CreateVoucher'

export default function CreateVoucherPage() {
  const [vouchers, setVouchers] = useState([])

  const handleCreateVoucher = (newVoucher) => {
    setVouchers([...vouchers, newVoucher])
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="pt-24 px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Create Voucher</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit a new voucher request
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <CreateVoucher onSubmit={handleCreateVoucher} />
          </div>
        </div>
      </div>
    </div>
  )
} 