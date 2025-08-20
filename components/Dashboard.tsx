import React, { useEffect, useState } from 'react'
import { useHabitStore } from '@/store/habitStore'
import { useAuthStore } from '@/store/authStore'
import { StatCard, SimpleStatCard } from './ui/StatCard'
import { ProgressBar } from './ui/ProgressBar'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  Award,
  Activity,
  Plus,
  Settings,
  BarChart3,
  Edit,
  Trash2,
  Eye,
  Bell,
  FileText,
  Zap,
  Home,
  User,
  BookOpen
} from 'lucide-react'
import { clsx } from 'clsx'
import Link from 'next/link'

interface DashboardProps {
  className?: string
}

export const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const { user } = useAuthStore()
  const { 
    habits, 
    habitLogs, 
    stats,
    isLoading,
    fetchHabits, 
    fetchHabitLogs, 
    fetchStats,
    logHabit,
    deleteHabit
  } = useHabitStore()
  
  const [loggingHabits, setLoggingHabits] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchHabits()
      fetchHabitLogs()
      fetchStats()
    }
  }, [user, fetchHabits, fetchHabitLogs, fetchStats])

  // 获取今日习惯完成状态
  const getTodayHabitStatus = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = habitLogs.filter(log => 
      log.completed_at?.startsWith(today)
    )
    
    const completedHabitIds = new Set(todayLogs.map(log => log.habit_id))
    
    return habits.map(habit => ({
      ...habit,
      isCompletedToday: completedHabitIds.has(habit.id),
      canLogToday: !completedHabitIds.has(habit.id)
    }))
  }

  // 计算今日统计
  const getTodayStats = () => {
    const todayHabits = getTodayHabitStatus()
    const totalHabits = todayHabits.length
    const completedHabits = todayHabits.filter(h => h.isCompletedToday).length
    const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0
    
    return {
      totalHabits,
      completedHabits,
      pendingHabits: totalHabits - completedHabits,
      completionRate
    }
  }

  // 获取连续天数最高的习惯
  const getTopStreakHabit = () => {
    if (habits.length === 0) return null
    
    return habits.reduce((top, habit) => {
      const habitLogsForHabit = habitLogs.filter(log => log.habit_id === habit.id)
      const streak = calculateStreak(habitLogsForHabit)
      
      if (!top || streak > top.streak) {
        return { habit, streak }
      }
      return top
    }, null as { habit: any, streak: number } | null)
  }

  // 计算连续天数
  const calculateStreak = (logs: any[]) => {
    if (logs.length === 0) return 0
    
    const sortedLogs = logs
      .filter(log => log.logged_at) // 过滤掉没有logged_at的记录
      .map(log => new Date(log.logged_at.split('T')[0]))
      .sort((a, b) => b.getTime() - a.getTime())
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const logDate of sortedLogs) {
      const diffTime = currentDate.getTime() - logDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  // 处理习惯签到
  const handleLogHabit = async (habitId: string) => {
    if (loggingHabits.has(habitId)) return
    
    setLoggingHabits(prev => new Set(prev).add(habitId))
    
    try {
      await logHabit(habitId)
      // 重新获取数据
      await Promise.all([
        fetchHabitLogs(),
        fetchStats()
      ])
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

  // 处理删除习惯
  const handleDeleteHabit = async (habitId: string) => {
    console.log('Dashboard删除按钮被点击，习惯ID:', habitId)
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
        await Promise.all([
          fetchHabits(),
          fetchHabitLogs(),
          fetchStats()
        ])
        console.log('习惯列表已更新')
      } catch (error) {
        console.error('Failed to delete habit:', error)
        alert('删除习惯时发生错误，请稍后重试')
      }
    }
  }

  if (isLoading) {
    return (
      <div className={clsx('space-y-6', className)}>
        {/* 加载骨架屏 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 animate-pulse rounded-lg h-64" />
          <div className="bg-gray-200 animate-pulse rounded-lg h-64" />
        </div>
      </div>
    )
  }

  const todayStats = getTodayStats()
  const topStreakHabit = getTopStreakHabit()
  const todayHabits = getTodayHabitStatus()

  return (
    <div className={clsx('space-y-6', className)}>
      {/* 快速导航组 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button size="sm" variant="ghost" className="flex items-center space-x-1">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">首页</span>
              </Button>
            </Link>
            <Link href="/habits">
              <Button size="sm" variant="ghost" className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">习惯</span>
              </Button>
            </Link>
            <Link href="/analytics">
              <Button size="sm" variant="ghost" className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">分析</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button size="sm" variant="ghost" className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">个人</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* 快速操作区域 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">快速操作</h2>
            <p className="text-sm text-gray-500">管理你的习惯和查看详细数据</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link 
            href="/habits" 
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 px-4 py-2 text-sm w-full flex items-center justify-center space-x-2 h-12"
          >
            <Plus className="w-5 h-5" />
            <span>添加新习惯</span>
          </Link>
          
          <Link 
            href="/habits" 
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 px-4 py-2 text-sm w-full flex items-center justify-center space-x-2 h-12"
          >
            <Settings className="w-5 h-5" />
            <span>管理习惯</span>
          </Link>
          
          <Link 
            href="/analytics" 
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-emerald-500 px-4 py-2 text-sm w-full flex items-center justify-center space-x-2 h-12"
          >
            <BarChart3 className="w-5 h-5" />
            <span>查看分析</span>
          </Link>
        </div>
      </div>
      {/* 今日统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleStatCard
          label="今日习惯"
          value={todayStats.totalHabits}
          icon={Target}
          color="blue"
        />
        
        <SimpleStatCard
          label="已完成"
          value={todayStats.completedHabits}
          icon={CheckCircle2}
          color="green"
        />
        
        <SimpleStatCard
          label="待完成"
          value={todayStats.pendingHabits}
          icon={Clock}
          color="yellow"
        />
        
        <SimpleStatCard
          label="完成率"
          value={`${Math.round(todayStats.completionRate)}%`}
          icon={TrendingUp}
          color={todayStats.completionRate >= 80 ? 'green' : todayStats.completionRate >= 60 ? 'yellow' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 今日习惯快速签到 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">今日习惯</h2>
          </div>
          
          {todayHabits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">开始你的习惯之旅</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                还没有创建任何习惯。创建你的第一个习惯，开始建立更好的生活方式！
              </p>
              <div className="space-y-3">
                <Link href="/habits">
                  <Button variant="primary" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>创建第一个习惯</span>
                  </Button>
                </Link>
                <div className="text-sm text-gray-400">
                  💡 建议：从简单的习惯开始，比如每天喝8杯水
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayHabits.map(habit => (
                <div
                  key={habit.id}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                    habit.isCompletedToday 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-lg',
                      habit.isCompletedToday 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {habit.icon}
                    </div>
                    <div>
                      <h3 className={clsx(
                        'font-medium',
                        habit.isCompletedToday ? 'text-green-900' : 'text-gray-900'
                      )}>
                        {habit.name}
                      </h3>
                      <p className={clsx(
                        'text-sm',
                        habit.isCompletedToday ? 'text-green-600' : 'text-gray-500'
                      )}>
                        {habit.type === 'positive' ? '积极习惯' : '消极习惯'} • {habit.frequency?.type === 'daily' ? '每日' : '每周'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* 操作按钮组 */}
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {/* TODO: 实现查看详情功能 */}}
                        className="p-1.5 h-8 w-8"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Link href={`/habits?edit=${habit.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1.5 h-8 w-8"
                          title="编辑习惯"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="删除习惯"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* 完成状态或签到按钮 */}
                    {habit.isCompletedToday ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">已完成</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant={habit.type === 'positive' ? 'primary' : 'secondary'}
                        onClick={() => handleLogHabit(habit.id)}
                        disabled={loggingHabits.has(habit.id)}
                        className="min-w-[80px]"
                      >
                        {loggingHabits.has(habit.id) ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          habit.type === 'positive' ? '完成' : '避免'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 统计信息和成就 */}
        <div className="space-y-6">
          {/* 今日进度 */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">今日进度</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">完成进度</span>
                  <span className="text-sm text-gray-500">
                    {todayStats.completedHabits}/{todayStats.totalHabits}
                  </span>
                </div>
                <ProgressBar
                  value={todayStats.completedHabits}
                  max={todayStats.totalHabits}
                  color={todayStats.completionRate >= 80 ? 'green' : todayStats.completionRate >= 60 ? 'yellow' : 'red'}
                  size="md"
                />
              </div>
              
              <div className="text-center pt-2">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(todayStats.completionRate)}%
                </div>
                <div className="text-sm text-gray-500">今日完成率</div>
              </div>
            </div>
          </Card>

          {/* 最佳连续记录 */}
          {topStreakHabit && (
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">最佳连续</h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl">
                  {topStreakHabit.habit.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{topStreakHabit.habit.name}</h3>
                  <p className="text-sm text-gray-500">连续 {topStreakHabit.streak} 天</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{topStreakHabit.streak}</div>
                  <div className="text-xs text-gray-500">天</div>
                </div>
              </div>
            </Card>
          )}

          {/* 总体统计 */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">总体统计</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats?.totalHabits || 0}</div>
                <div className="text-xs text-gray-500">总习惯数</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats?.completedToday || 0}</div>
                <div className="text-xs text-gray-500">今日完成</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{Math.round(stats?.completionRate || 0)}%</div>
                <div className="text-xs text-gray-500">完成率</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{Math.max(...(stats?.streaks.map(s => s.streak) || [0]))}</div>
                <div className="text-xs text-gray-500">最长连续</div>
              </div>
            </div>
          </Card>
          
          {/* 实用工具 */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900">实用工具</h2>
            </div>
            
            <div className="space-y-4">
              {/* 今日目标 */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800">今日目标</span>
                  <Button size="sm" variant="ghost" className="text-yellow-600 hover:text-yellow-800">
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-yellow-700">
                  完成 {Math.ceil(todayStats.totalHabits * 0.8)} 个习惯 ({Math.round(todayStats.completionRate)}% 已完成)
                </p>
              </div>
              
              {/* 快速笔记 */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-800">快速笔记</span>
                </div>
                <textarea 
                  placeholder="记录今天的想法或感受..."
                  className="w-full text-sm bg-transparent border-none resize-none focus:outline-none text-blue-700 placeholder-blue-400"
                  rows={2}
                />
              </div>
              
              {/* 提醒设置 */}
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2"
                onClick={() => {/* TODO: 实现提醒设置功能 */}}
              >
                <Bell className="w-4 h-4" />
                <span>设置提醒</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}