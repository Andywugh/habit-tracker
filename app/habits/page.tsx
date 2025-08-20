'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useHabitStore } from '@/store/habitStore'
import { HabitCard } from '@/components/habits/HabitCard'
import { HabitForm } from '@/components/habits/HabitForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Plus, Search, Filter, Target } from 'lucide-react'
import { clsx } from 'clsx'

// 计算习惯统计数据的辅助函数
const getHabitStats = (habitId: string, habitLogs: any[], habits: any[]) => {
  const habit = habits.find(h => h.id === habitId)
  if (!habit) return { totalLogs: 0, streakCount: 0, habitCompletionRate: 0 }
  
  const habitLogsForHabit = habitLogs.filter(log => log.habit_id === habitId)
  const totalLogs = habitLogsForHabit.length
  
  // 计算连续天数
  const streakCount = calculateStreak(habitLogsForHabit)
  
  // 计算完成率（基于过去30天）
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const habitCreatedAt = new Date(habit.created_at)
  const startDate = habitCreatedAt > thirtyDaysAgo ? habitCreatedAt : thirtyDaysAgo
  const today = new Date()
  const daysDiff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const expectedDays = Math.min(daysDiff, 30)
  
  const recentLogs = habitLogsForHabit.filter(log => {
    if (!log.completed_at || typeof log.completed_at !== 'string') return false
    const logDate = new Date(log.completed_at)
    return logDate >= startDate
  })
  
  const habitCompletionRate = expectedDays > 0 ? (recentLogs.length / expectedDays) * 100 : 0
  
  return {
    totalLogs,
    streakCount,
    habitCompletionRate: Math.round(habitCompletionRate)
  }
}

// 计算连续天数的辅助函数
const calculateStreak = (logs: any[]) => {
  if (logs.length === 0) return 0
  
  // 按日期排序（最新的在前）
  const sortedLogs = logs
    .filter(log => log.completed_at && typeof log.completed_at === 'string')
    .map(log => {
      try {
        return new Date(log.completed_at.split('T')[0])
      } catch (error) {
        console.warn('Invalid date format:', log.completed_at)
        return null
      }
    })
    .filter(date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime())
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  // 检查是否有今天的记录
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const hasToday = sortedLogs.some(date => date.getTime() === today.getTime())
  
  if (!hasToday) {
    // 如果今天没有记录，从昨天开始计算
    currentDate.setDate(currentDate.getDate() - 1)
  }
  
  for (const logDate of sortedLogs) {
    if (logDate.getTime() === currentDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

export default function HabitsPage() {
  const router = useRouter()
  const { user, session, isLoading: authLoading } = useAuthStore()
  const { 
    habits, 
    habitLogs, 
    isLoading, 
    fetchHabits, 
    fetchHabitLogs, 
    logHabit, 
    deleteHabit 
  } = useHabitStore()
  
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<any>(null)
  const [loggingHabits, setLoggingHabits] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative'>('all')
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'daily' | 'weekly'>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }
    
    if (user) {
      fetchHabits()
      fetchHabitLogs()
    }
  }, [user, authLoading, router, fetchHabits, fetchHabitLogs])

  // 检查习惯今天是否已完成
  const isCompletedToday = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return habitLogs.some(log => 
      log.habit_id === habitId && 
      log.completed_at && 
      typeof log.completed_at === 'string' &&
      log.completed_at.startsWith(today)
    )
  }

  // 处理习惯记录
  const handleLogHabit = async (habitId: string) => {
    if (loggingHabits.has(habitId)) return
    
    setLoggingHabits(prev => new Set(prev).add(habitId))
    
    try {
      await logHabit(habitId)
      await fetchHabitLogs() // 重新获取日志以更新UI
    } catch (error) {
      console.error('Failed to log habit:', error)
    } finally {
      setLoggingHabits(prev => {
        const newSet = new Set(prev)
        newSet.delete(habitId)
        return newSet
      })
    }
  }

  // 处理编辑习惯
  const handleEditHabit = (habit: any) => {
    setEditingHabit(habit)
    setShowHabitForm(true)
  }

  // 处理删除习惯
  const handleDeleteHabit = async (habitId: string) => {
    console.log('删除按钮被点击，习惯ID:', habitId)
    const habit = habits.find(h => h.id === habitId)
    const habitName = habit?.name || '该习惯'
    console.log('找到习惯:', habit)
    
    // 使用自定义确认对话框替代原生confirm
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        // 创建确认对话框
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
            <p class="text-gray-600 mb-6">确定要删除"${habitName}"吗？这将同时删除所有相关记录，此操作无法撤销。</p>
            <div class="flex justify-end space-x-3">
              <button id="cancel-btn" class="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                取消
              </button>
              <button id="confirm-btn" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                删除
              </button>
            </div>
          </div>
        `
        
        document.body.appendChild(modal)
        
        const cancelBtn = modal.querySelector('#cancel-btn')
        const confirmBtn = modal.querySelector('#confirm-btn')
        
        const cleanup = () => {
          document.body.removeChild(modal)
        }
        
        cancelBtn?.addEventListener('click', () => {
          cleanup()
          resolve(false)
        })
        
        confirmBtn?.addEventListener('click', () => {
          cleanup()
          resolve(true)
        })
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            cleanup()
            resolve(false)
          }
        })
      })
    }
    
    const confirmResult = await confirmDelete()
    console.log('用户确认结果:', confirmResult)
    
    if (confirmResult) {
      try {
        console.log('开始调用deleteHabit API...')
        const result = await deleteHabit(habitId)
        console.log('deleteHabit API返回结果:', result)
        
        if (result.error) {
          console.error('删除失败:', result.error)
          alert(`删除失败：${result.error.message}`)
          return
        }
        
        console.log('删除成功，显示成功消息')
        // 显示成功消息
        const successMessage = document.createElement('div')
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        successMessage.textContent = `"${habitName}"已成功删除`
        document.body.appendChild(successMessage)
        
        // 3秒后移除消息
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage)
          }
        }, 3000)
        
        console.log('重新获取习惯列表...')
        await fetchHabits() // 重新获取习惯列表
        console.log('习惯列表已更新')
      } catch (error) {
        console.error('Failed to delete habit:', error)
        alert('删除习惯时发生错误，请稍后重试')
      }
    }
  }

  // 处理表单关闭
  const handleFormClose = () => {
    setShowHabitForm(false)
    setEditingHabit(null)
    fetchHabits() // 重新获取习惯列表
  }

  // 过滤习惯
  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || habit.type === filterType
    const matchesFrequency = filterFrequency === 'all' || habit.frequency?.type === filterFrequency
    
    return matchesSearch && matchesType && matchesFrequency
  })

  // 统计信息
  const stats = {
    total: habits.length,
    positive: habits.filter(h => h.type === 'positive').length,
    negative: habits.filter(h => h.type === 'negative').length,
    daily: habits.filter(h => h.frequency?.type === 'daily').length,
    weekly: habits.filter(h => h.frequency?.type === 'weekly').length
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600">您需要登录才能查看习惯追踪器</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">习惯管理</h1>
            <p className="text-gray-600 mt-1">管理你的所有习惯，追踪进度和统计</p>
          </div>
          <Button
            onClick={() => setShowHabitForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>添加习惯</span>
          </Button>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">总习惯</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
            <div className="text-sm text-gray-600">积极习惯</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
            <div className="text-sm text-gray-600">消极习惯</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.daily}</div>
            <div className="text-sm text-gray-600">每日习惯</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.weekly}</div>
            <div className="text-sm text-gray-600">每周习惯</div>
          </Card>
        </div>

        {/* 搜索和过滤 */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索习惯..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* 类型过滤 */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有类型</option>
                <option value="positive">积极习惯</option>
                <option value="negative">消极习惯</option>
              </select>
            </div>
            
            {/* 频率过滤 */}
            <div>
              <select
                value={filterFrequency}
                onChange={(e) => setFilterFrequency(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有频率</option>
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 习惯列表 */}
        {filteredHabits.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {habits.length === 0 ? '还没有习惯' : '没有找到匹配的习惯'}
            </h3>
            <p className="text-gray-600 mb-6">
              {habits.length === 0 
                ? '开始创建你的第一个习惯，建立更好的生活方式' 
                : '尝试调整搜索条件或过滤器'
              }
            </p>
            {habits.length === 0 && (
              <Button
                onClick={() => setShowHabitForm(true)}
                className="flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>创建第一个习惯</span>
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHabits.map((habit) => {
              const stats = getHabitStats(habit.id, habitLogs, habits)
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isCompletedToday={isCompletedToday(habit.id)}
                  onComplete={() => handleLogHabit(habit.id)}
                  onEdit={() => handleEditHabit(habit)}
                  onDelete={() => handleDeleteHabit(habit.id)}
                  totalLogs={stats.totalLogs}
                  streakCount={stats.streakCount}
                  completionRate={stats.habitCompletionRate}
                />
              )
            })}
          </div>
        )}

        {/* 习惯表单模态框 */}
        <HabitForm
          isOpen={showHabitForm}
          habit={editingHabit}
          onClose={handleFormClose}
          onSave={async (habitData) => {
            try {
              if (!session?.access_token) {
                throw new Error('用户未登录')
              }

              // 处理数据格式，确保符合API期望
              const processedData = {
                ...habitData,
                // 将空字符串的reminder_time转换为null
                reminder_time: habitData.reminder_time === '' ? null : habitData.reminder_time,
                // 确保frequency字段格式正确，包含count属性
                frequency: {
                  type: habitData.frequency?.type || 'daily',
                  count: habitData.frequency?.count || 1,
                  ...(habitData.frequency?.days && { days: habitData.frequency.days })
                }
              }

              console.log('发送的数据:', JSON.stringify(processedData, null, 2))

              const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              }

              if (editingHabit) {
                // 更新习惯
                const response = await fetch(`/api/habits/${editingHabit.id}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(processedData),
                })

                if (!response.ok) {
                  const errorText = await response.text()
                  console.error('更新习惯失败，响应:', errorText)
                  const errorData = JSON.parse(errorText)
                  throw new Error(errorData.error || '更新习惯失败')
                }

                console.log('习惯更新成功')
              } else {
                // 创建新习惯
                const response = await fetch('/api/habits', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(processedData),
                })

                if (!response.ok) {
                  const errorText = await response.text()
                  console.error('创建习惯失败，响应:', errorText)
                  const errorData = JSON.parse(errorText)
                  throw new Error(errorData.error || '创建习惯失败')
                }

                console.log('习惯创建成功')
              }

              // 关闭表单并刷新数据
              handleFormClose()
            } catch (error) {
              console.error('操作失败:', error)
              // 这里可以添加用户友好的错误提示
              alert(error instanceof Error ? error.message : '操作失败，请重试')
            }
          }}
        />
      </div>
    </div>
  )
}