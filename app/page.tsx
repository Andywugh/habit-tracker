'use client'

import { useAuthStore } from '../src/store/authStore'
import { Login } from '../src/pages/Login'
import { Dashboard } from '../src/pages/Dashboard'
import { Layout } from '../src/components/layout/Layout'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuthStore()

  useEffect(() => {
    // 初始化认证状态
    useAuthStore.getState().initialize()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}