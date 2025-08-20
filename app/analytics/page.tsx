'use client'

import { useAuthStore } from '@/store/authStore'
import { useHabitStore } from '@/store/habitStore'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { Calendar, TrendingUp, Target, Award } from 'lucide-react'

export default function AnalyticsPage() {
  const { user, isLoading } = useAuthStore()
  const { habits, habitLogs, stats, fetchHabits, fetchHabitLogs, fetchStats } = useHabitStore()
  const [dataLoading, setDataLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30')

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
      loadData()
    }
  }, [user, selectedPeriod])

  const loadData = async () => {
    setDataLoading(true)
    try {
      await Promise.all([
        fetchHabits(),
        fetchHabitLogs(),
        fetchStats(selectedPeriod)
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setDataLoading(false)
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

  if (dataLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // 计算统计数据
  const totalHabits = habits.length
  const activeHabits = habits.filter(h => h.is_active !== false).length
  const totalLogs = habitLogs.length
  const avgCompletionRate = stats?.overall_completion_rate || 0
  const longestStreak = Math.max(0, ...habits.map(habit => {
    const logs = habitLogs.filter(log => log.habit_id === habit.id)
    return logs.length
  }))

  // 生成最近7天的数据
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  const weeklyData = last7Days.map(date => {
    const dayLogs = habitLogs.filter(log => 
      log.completed_at?.startsWith(date)
    )
    const dayHabits = habits.filter(h => h.frequency?.type === 'daily')
    return {
      date,
      completed: dayLogs.length,
      total: dayHabits.length,
      rate: dayHabits.length > 0 ? Math.round((dayLogs.length / dayHabits.length) * 100) : 0
    }
  })

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">数据分析</h1>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="7">最近7天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
          </select>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总习惯数</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHabits}</div>
              <p className="text-xs text-muted-foreground">
                活跃习惯: {activeHabits}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总记录数</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLogs}</div>
              <p className="text-xs text-muted-foreground">
                累计完成次数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均完成率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {avgCompletionRate >= 80 ? '表现优秀' : avgCompletionRate >= 60 ? '继续努力' : '需要加油'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最长连续</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{longestStreak}</div>
              <p className="text-xs text-muted-foreground">
                天数记录
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 最近7天完成率趋势 */}
          <Card>
            <CardHeader>
              <CardTitle>最近7天完成率趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((day, index) => (
                  <div key={day.date} className="flex items-center space-x-4">
                    <div className="w-16 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${day.rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12">{day.rate}%</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {day.completed}/{day.total}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 习惯分布 */}
          <Card>
            <CardHeader>
              <CardTitle>习惯类型分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {habits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无习惯数据</p>
                ) : (
                  habits.map((habit) => {
                    const habitLogsForHabit = habitLogs.filter(log => log.habit_id === habit.id)
                    const completionRate = habitLogsForHabit.length > 0 ? 
                      Math.round((habitLogsForHabit.length / parseInt(selectedPeriod)) * 100) : 0
                    
                    return (
                      <div key={habit.id} className="flex items-center space-x-4">
                        <div className="text-2xl">{habit.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{habit.name}</span>
                            <span className="text-sm text-gray-500">{completionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                habit.type === 'positive' ? 'bg-green-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(completionRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细统计 */}
        <Card>
          <CardHeader>
            <CardTitle>详细统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 mb-2">
                  {habits.filter(h => h.type === 'positive').length}
                </div>
                <p className="text-gray-600">积极习惯</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {habits.filter(h => h.type === 'negative').length}
                </div>
                <p className="text-gray-600">消极习惯</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {habits.filter(h => h.frequency?.type === 'daily').length}
                </div>
                <p className="text-gray-600">每日习惯</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}