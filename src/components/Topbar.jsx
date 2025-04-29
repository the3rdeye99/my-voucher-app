import { useState } from 'react'

function Topbar() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="h-16 bg-white shadow-sm fixed top-0 right-0 left-64 z-10">
      <div className="h-full px-6 flex items-center justify-end space-x-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white">
            U
          </div>
          <span className="text-gray-700">User</span>
        </div>
      </div>
    </div>
  )
}

export default Topbar 