import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Home from './pages/Home'
import Vouchers from './pages/Vouchers'
import CreateVoucher from './pages/CreateVoucher'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import UserManagement from './pages/UserManagement'
import StaffDashboard from './pages/StaffDashboard'
import AccountantDashboard from './pages/AccountantDashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <Topbar />
          <main className="ml-64 pt-16">
            <div className="p-6">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vouchers"
                  element={
                    <ProtectedRoute>
                      <Vouchers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-voucher"
                  element={
                    <ProtectedRoute requiredRole="staff">
                      <CreateVoucher />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accountant-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['accountant']}>
                      <AccountantDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App 