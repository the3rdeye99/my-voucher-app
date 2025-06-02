'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('AuthProvider: Checking for stored user data')
    // Check for stored user data on initial load
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      console.log('AuthProvider: Found stored user:', JSON.parse(storedUser))
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    console.log('AuthProvider: Login called with user data:', userData)
    // Store user data
    const userToStore = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      organization: userData.organization
    }
    console.log('AuthProvider: Storing user data:', userToStore)
    setUser(userToStore)
    localStorage.setItem('user', JSON.stringify(userToStore))
    console.log('AuthProvider: User data stored in localStorage')
  }

  const logout = () => {
    console.log('AuthProvider: Logout called')
    setUser(null)
    localStorage.removeItem('user')
    router.push('/login')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 