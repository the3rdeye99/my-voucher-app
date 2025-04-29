import { Link } from 'react-router-dom'

function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Total Vouchers</h2>
          <p className="text-3xl font-bold text-red-600">24</p>
          <p className="text-gray-600 mt-2">Active vouchers this month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Used Vouchers</h2>
          <p className="text-3xl font-bold text-green-600">12</p>
          <p className="text-gray-600 mt-2">Vouchers redeemed this month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Expired Vouchers</h2>
          <p className="text-3xl font-bold text-gray-600">5</p>
          <p className="text-gray-600 mt-2">Vouchers expired this month</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          <Link
            to="/create-voucher"
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Create New Voucher
          </Link>
          <Link
            to="/vouchers"
            className="bg-white text-gray-800 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            View All Vouchers
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home 