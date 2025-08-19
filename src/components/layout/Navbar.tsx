import React from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { ChartBarIcon, UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <ChartBarIcon className="h-8 w-8 text-emerald-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">习惯追踪器</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <UserCircleIcon className="h-6 w-6 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {user.user_metadata?.name || user.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}}
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-1" />
                  设置
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                >
                  退出登录
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  登录
                </Button>
                <Button variant="primary" size="sm">
                  注册
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}