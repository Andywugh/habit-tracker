'use client'

import { useAuthStore } from '@/store/authStore'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { User, Bell, Shield, Trash2, Save } from 'lucide-react'

export default function SettingsPage() {
  const { user, isLoading, signOut } = useAuthStore()
  const [profile, setProfile] = useState({
    display_name: '',
    email: '',
    timezone: 'Asia/Shanghai'
  })
  const [notifications, setNotifications] = useState({
    daily_reminder: true,
    weekly_summary: true,
    achievement_alerts: true,
    reminder_time: '09:00'
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // 初始化认证状态
    useAuthStore.getState().initialize()
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/')
    }
  }, [user, isLoading])

  useEffect(() => {
    if (user) {
      setProfile({
        display_name: user.user_metadata?.display_name || '',
        email: user.email || '',
        timezone: user.user_metadata?.timezone || 'Asia/Shanghai'
      })
      
      // 加载通知设置
      loadNotificationSettings()
    }
  }, [user])

  const loadNotificationSettings = async () => {
    try {
      const { session } = useAuthStore.getState()
      if (!session) return

      const response = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('用户未授权，跳过加载通知设置')
          return
        }
        if (response.status === 404) {
          // 用户还没有通知设置，使用默认值
          console.info('用户通知设置不存在，使用默认设置')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.success && result.data) {
        setNotifications({
          daily_reminder: result.data.daily_reminder,
          weekly_summary: result.data.weekly_summary,
          achievement_alerts: result.data.achievement_alerts,
          reminder_time: result.data.reminder_time,
        })
      } else if (result.error) {
        console.error('加载通知设置失败:', result.error)
      }
    } catch (error) {
      console.error('加载通知设置失败:', error)
      // 不显示错误消息给用户，因为这是后台加载操作
      // 如果加载失败，用户仍然可以使用默认设置
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')
    
    // 验证输入
    if (!profile.display_name.trim()) {
      setMessage('显示名称不能为空')
      setSaving(false)
      return
    }
    
    try {
      const { session } = useAuthStore.getState()
      if (!session) {
        setMessage('登录已过期，请重新登录')
        setSaving(false)
        return
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: profile.display_name.trim(),
          timezone: profile.timezone,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setMessage('登录已过期，请重新登录')
          return
        }
        if (response.status === 403) {
          setMessage('没有权限执行此操作')
          return
        }
        if (response.status >= 500) {
          setMessage('服务器错误，请稍后重试')
          return
        }
      }

      const result = await response.json()
      if (result.success) {
        setMessage('资料保存成功！')
      } else {
        setMessage(result.error || '保存失败，请重试')
      }
    } catch (error) {
      console.error('保存资料失败:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setMessage('网络连接失败，请检查网络后重试')
      } else {
        setMessage('保存失败，请重试')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    setMessage('')
    
    // 验证提醒时间格式
    if (notifications.reminder_time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(notifications.reminder_time)) {
      setMessage('提醒时间格式不正确，请使用 HH:MM 格式')
      setSaving(false)
      return
    }
    
    try {
      const { session } = useAuthStore.getState()
      if (!session) {
        setMessage('登录已过期，请重新登录')
        setSaving(false)
        return
      }

      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(notifications),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setMessage('登录已过期，请重新登录')
          return
        }
        if (response.status === 403) {
          setMessage('没有权限执行此操作')
          return
        }
        if (response.status >= 500) {
          setMessage('服务器错误，请稍后重试')
          return
        }
      }

      const result = await response.json()
      if (result.success) {
        setMessage('通知设置保存成功！')
      } else {
        setMessage(result.error || '保存失败，请重试')
      }
    } catch (error) {
      console.error('保存通知设置失败:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setMessage('网络连接失败，请检查网络后重试')
      } else {
        setMessage('保存失败，请重试')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      redirect('/')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">设置</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 用户资料 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>用户资料</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  显示名称
                </label>
                <Input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="输入您的显示名称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱地址
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">邮箱地址无法修改</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  时区
                </label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                  <option value="America/New_York">美国东部时间 (UTC-5)</option>
                  <option value="Europe/London">英国时间 (UTC+0)</option>
                  <option value="Asia/Tokyo">日本时间 (UTC+9)</option>
                </select>
              </div>
              
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存资料'}
              </Button>
            </CardContent>
          </Card>

          {/* 通知设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>通知设置</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">每日提醒</h3>
                  <p className="text-sm text-gray-500">每天提醒您完成习惯</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.daily_reminder}
                    onChange={(e) => setNotifications({ ...notifications, daily_reminder: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">周报总结</h3>
                  <p className="text-sm text-gray-500">每周发送习惯完成总结</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.weekly_summary}
                    onChange={(e) => setNotifications({ ...notifications, weekly_summary: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">成就提醒</h3>
                  <p className="text-sm text-gray-500">达成里程碑时通知您</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.achievement_alerts}
                    onChange={(e) => setNotifications({ ...notifications, achievement_alerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒时间
                </label>
                <Input
                  type="time"
                  value={notifications.reminder_time}
                  onChange={(e) => setNotifications({ ...notifications, reminder_time: e.target.value })}
                />
              </div>
              
              <Button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存设置'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 账户管理 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>账户管理</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">账户信息</h3>
                <p className="text-sm text-gray-500">注册时间: {new Date(user.created_at).toLocaleDateString('zh-CN')}</p>
                <p className="text-sm text-gray-500">最后登录: {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('zh-CN')}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">账户操作</h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="flex-1"
                  >
                    退出登录
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('确定要删除账户吗？此操作不可恢复。')) {
                        // 这里应该调用删除账户的API
                        alert('删除账户功能正在开发中')
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除账户
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}