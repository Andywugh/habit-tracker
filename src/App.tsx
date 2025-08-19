import React, { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Analytics } from './pages/Analytics'
import { Settings } from './pages/Settings'
import './App.css'

type Page = 'dashboard' | 'analytics' | 'settings'

function App() {
  const { user, loading, initialize } = useAuthStore()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    initialize()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />
      case 'analytics':
        return <Analytics onNavigate={setCurrentPage} />
      case 'settings':
        return <Settings onNavigate={setCurrentPage} />
      default:
        return <Dashboard onNavigate={setCurrentPage} />
    }
  }

  return renderPage()
}

export default App
