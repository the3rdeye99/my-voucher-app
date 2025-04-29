'use client'

import { useState } from 'react'
import { createVoucher } from '../services/api'

export default function CreateVoucher({ onSubmit }) {
  const [formData, setFormData] = useState({
    purpose: '',
    amount: '',
    description: '',
    staffName: '',
    neededBy: '',
    file: null
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.purpose) newErrors.purpose = 'Purpose is required'
    if (!formData.amount) newErrors.amount = 'Amount is required'
    if (formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0'
    if (!formData.description) newErrors.description = 'Description is required'
    if (!formData.staffName) newErrors.staffName = 'Staff name is required'
    if (!formData.neededBy) newErrors.neededBy = 'Needed by date is required'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const newVoucher = {
        id: `V${Date.now()}`,
        ...formData,
        status: 'pending',
        date: new Date().toISOString(),
        amount: parseFloat(formData.amount)
      }

      const createdVoucher = await createVoucher(newVoucher)
      onSubmit(createdVoucher)
      
      // Reset form
      setFormData({
        purpose: '',
        amount: '',
        description: '',
        staffName: '',
        neededBy: '',
        file: null
      })
      setErrors({})
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to create voucher. Please try again.'
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🆕 Create Voucher</h2>
      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
          {errors.submit}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
            Purpose
          </label>
          <input
            type="text"
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm ${
              errors.purpose ? 'border-red-500' : ''
            }`}
          />
          {errors.purpose && (
            <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm ${
              errors.amount ? 'border-red-500' : ''
            }`}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        <div>
          <label htmlFor="staffName" className="block text-sm font-medium text-gray-700">
            Staff Name
          </label>
          <input
            type="text"
            id="staffName"
            name="staffName"
            value={formData.staffName}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm ${
              errors.staffName ? 'border-red-500' : ''
            }`}
          />
          {errors.staffName && (
            <p className="mt-1 text-sm text-red-600">{errors.staffName}</p>
          )}
        </div>

        <div>
          <label htmlFor="neededBy" className="block text-sm font-medium text-gray-700">
            Needed By
          </label>
          <input
            type="date"
            id="neededBy"
            name="neededBy"
            value={formData.neededBy}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm ${
              errors.neededBy ? 'border-red-500' : ''
            }`}
          />
          {errors.neededBy && (
            <p className="mt-1 text-sm text-red-600">{errors.neededBy}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm ${
              errors.description ? 'border-red-500' : ''
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Upload File (Optional)
          </label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Voucher'}
          </button>
        </div>
      </form>
    </div>
  )
} 