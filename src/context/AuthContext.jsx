'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('AuthProvider: Starting initialization')
    const checkAuth = async () => {
      try {
        console.log('AuthProvider: Checking localStorage for user data')
        const storedUser = localStorage.getItem('user')
        console.log('AuthProvider: Raw stored user data:', storedUser)
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          console.log('AuthProvider: Successfully parsed user data:', parsedUser)
          setUser(parsedUser)
        } else {
          console.log('AuthProvider: No stored user data found')
        }
      } catch (error) {
        console.error('AuthProvider: Error during initialization:', error)
        localStorage.removeItem('user')
      } finally {
        console.log('AuthProvider: Setting loading to false')
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (userData) => {
    try {
      console.log('AuthProvider: Login called with user data:', userData)
      const userToStore = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        organization: {
          _id: userData.organization._id,
          name: userData.organization.name
        }
      }
      console.log('AuthProvider: Storing user data:', userToStore)
      setUser(userToStore)
      localStorage.setItem('user', JSON.stringify(userToStore))
      console.log('AuthProvider: User data stored in localStorage')
    } catch (error) {
      console.error('AuthProvider: Error during login:', error)
      throw error
    }
  }

  const logout = () => {
    try {
      console.log('AuthProvider: Logout called')
      setUser(null)
      localStorage.removeItem('user')
      router.push('/login')
    } catch (error) {
      console.error('AuthProvider: Error during logout:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  console.log('AuthProvider: Current state:', { user, loading, isAuthenticated: !!user })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 