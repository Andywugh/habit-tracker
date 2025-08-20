import React, { useState, useEffect } from 'react'

import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { User, Bell, Shield, Palette, Download, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  name: string
  avatar_url?: string
  timezone: string
  notification_enabled: boolean
  theme: 'light' | 'dark' | 'system'
}

export default function Settings() {
  const { user, signOut } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    avatar_url: '',
    timezone: 'Asia/Shanghai',
    notification_enabled: true,
    theme: 'light'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      console.log('开始获取用户资料，用户ID:', user.id)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('获取用户资料失败:', error)
        toast.error('获取用户资料失败，请刷新页面重试')
        setLoading(false)
        return
      }

      if (data) {
        console.log('成功获取用户资料:', data)
        setProfile({
          id: data.id,
          name: data.name || '',
          avatar_url: data.avatar_url || '',
          timezone: data.timezone || 'Asia/Shanghai',
          notification_enabled: data.notification_enabled ?? true,
          theme: data.theme || 'light'
        })
      } else {
        console.log('未找到用户资料，使用默认值')
        // 如果没有找到用户资料，使用默认值
        setProfile(prev => ({
          ...prev,
          id: user?.id || '',
          name: user?.user_metadata?.name || user?.email?.split('@')[0] || ''
        }))
      }
    } catch (error: any) {
      console.error('获取用户资料失败:', error)
      toast.error('获取用户资料失败，请刷新页面重试')
    } finally {
      console.log('设置loading为false')
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      // 验证必填字段
      if (!profile.name.trim()) {
        toast.error('请输入姓名')
        return
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          name: profile.name.trim(),
          avatar_url: profile.avatar_url?.trim() || null,
          timezone: profile.timezone,
          notification_enabled: profile.notification_enabled,
          theme: profile.theme,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`数据库保存失败: ${error.message}`)
      }

      toast.success('个人资料已保存')
    } catch (error: any) {
      console.error('保存个人资料失败:', error)
      const errorMessage = error?.message || '保存个人资料失败，请稍后重试'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      // 获取用户的所有数据
      const [habitsResult, logsResult] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user?.id),
        supabase.from('habit_logs').select('*').eq('user_id', user?.id)
      ])

      const exportData = {
        profile: profile,
        habits: habitsResult.data || [],
        logs: logsResult.data || [],
        exportDate: new Date().toISOString()
      }

      // 创建并下载JSON文件
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `habit-tracker-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('数据导出成功')
    } catch (error) {
      console.error('导出数据失败:', error)
      toast.error('导出数据失败')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // 删除用户的所有数据
      await Promise.all([
        supabase.from('habit_logs').delete().eq('user_id', user?.id),
        supabase.from('habits').delete().eq('user_id', user?.id),
        supabase.from('user_profiles').delete().eq('id', user?.id)
      ])

      // 删除用户账户
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '')
      if (error) throw error

      toast.success('账户已删除')
      signOut()
    } catch (error) {
      console.error('删除账户失败:', error)
      toast.error('删除账户失败')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg text-gray-600">加载设置中...</div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          个人设置
        </h1>
        <p className="text-gray-600">
          管理您的个人信息和应用偏好设置
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* 个人信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>个人信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="姓名"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入您的姓名"
              />
              <Input
                label="邮箱"
                value={user?.email || ''}
                disabled
                helperText="邮箱地址无法修改"
              />
            </div>
            
            <Input
              label="头像URL"
              value={profile.avatar_url || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
              placeholder="请输入头像图片链接"
              helperText="可选：输入头像图片的URL地址"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时区
              </label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                <option value="America/New_York">美国东部时间 (UTC-5)</option>
                <option value="America/Los_Angeles">美国西部时间 (UTC-8)</option>
                <option value="Europe/London">英国时间 (UTC+0)</option>
                <option value="Asia/Tokyo">日本时间 (UTC+9)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? '保存中...' : '保存更改'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 通知设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-green-600" />
              <span>通知设置</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">推送通知</h3>
                  <p className="text-sm text-gray-600">接收习惯提醒和进度更新</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notification_enabled}
                    onChange={(e) => setProfile(prev => ({ ...prev, notification_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主题设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-purple-600" />
              <span>外观设置</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                主题模式
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: '浅色模式' },
                  { value: 'dark', label: '深色模式' },
                  { value: 'system', label: '跟随系统' }
                ].map((theme) => (
                  <label key={theme.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={profile.theme === theme.value}
                      onChange={(e) => setProfile(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'system' }))}
                      className="sr-only peer"
                    />
                    <div className="p-3 border-2 border-gray-200 rounded-lg peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium text-center">{theme.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 数据管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <span>数据管理</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">导出数据</h3>
                <p className="text-sm text-gray-600">下载您的所有习惯和记录数据</p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportData}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>导出</span>
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">删除账户</h3>
                <p className="text-sm text-gray-600">永久删除您的账户和所有数据</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>删除</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              确认删除账户
            </h3>
            <p className="text-gray-600 mb-6">
              此操作将永久删除您的账户和所有数据，包括习惯记录、统计信息等。此操作无法撤销。
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}