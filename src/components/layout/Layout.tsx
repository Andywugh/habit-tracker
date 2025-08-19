import React from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { LogOut, Home, BarChart3, Settings } from 'lucide-react'

type Page = 'dashboard' | 'analytics' | 'settings'

interface LayoutProps {
  children: React.ReactNode
  currentPage?: Page
  onNavigate?: (page: Page) => void
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage = 'dashboard', onNavigate }) => {
  const { user, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
  }

  const navItems = [
    { id: 'dashboard' as Page, label: '仪表盘', icon: Home },
    { id: 'analytics' as Page, label: '数据分析', icon: BarChart3 },
    { id: 'settings' as Page, label: '设置', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">习惯追踪器</h1>
              {onNavigate && (
                <nav className="flex space-x-4">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === item.id
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </nav>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>退出</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}