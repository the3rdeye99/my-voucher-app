'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import AdminSidebar from '../../components/AdminSidebar'
import VouchersList from '../../components/admin/VouchersList'
import UsersList from '../../components/admin/UsersList'
import { getVouchers, getUsers, approveVoucher, createUser, updateUser, deleteUser } from '../../services/api'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [vouchers, setVouchers] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'staff',
    password: ''
  })
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [vouchersData, usersData] = await Promise.all([
        getVouchers(),
        getUsers()
      ])
      setVouchers(vouchersData)
      setUsers(usersData)
    } catch (error) {
      setError('Failed to fetch data. Please try again later.')
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveVoucher = async (voucherId) => {
    try {
      await approveVoucher(voucherId)
      // Refresh the vouchers list
      await fetchData()
    } catch (error) {
      console.error('Error approving voucher:', error)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await createUser(newUser)
      setShowAddUserModal(false)
      setNewUser({
        name: '',
        email: '',
        role: 'staff',
        password: ''
      })
      setSuccessMessage('User created successfully!')
      // Refresh the users list
      await fetchData()
    } catch (error) {
      setError('Failed to create user. Please try again.')
      console.error('Error creating user:', error)
    }
  }

  const handleEditUser = async (updatedUser) => {
    try {
      await updateUser(updatedUser)
      // Refresh the users list
      await fetchData()
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId)
      // Refresh the users list
      await fetchData()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, error])

  const approvedVouchers = vouchers.filter(voucher => voucher.status === 'approved')
  const paidVouchers = vouchers.filter(voucher => voucher.status === 'paid')
  const pendingVouchers = vouchers.filter(voucher => voucher.status === 'pending')

  const formatAmount = (amount) => {
    return `₦${amount.toLocaleString()}`
  }

  const totalAmountPending = approvedVouchers.reduce((sum, voucher) => sum + voucher.amount, 0)

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar />
        <main className="pt-24 p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              Manage vouchers and users in the system
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  📋
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Vouchers</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? (
                      <span className="animate-pulse h-8 w-16 bg-gray-200 rounded block"></span>
                    ) : (
                      vouchers.length
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  👥
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? (
                      <span className="animate-pulse h-8 w-16 bg-gray-200 rounded block"></span>
                    ) : (
                      users.length
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  ⏳
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Pending Vouchers</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? (
                      <span className="animate-pulse h-8 w-16 bg-gray-200 rounded block"></span>
                    ) : (
                      pendingVouchers.length
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vouchers Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">📋 Vouchers Overview</h2>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <VouchersList
                vouchers={vouchers}
                onApprove={handleApproveVoucher}
              />
            )}
          </div>

          {/* Users Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">👥 User Management</h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Add User
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <UsersList
                users={users}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    required
                  >
                    <option value="staff">Staff</option>
                    <option value="accountant">Accountant</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 