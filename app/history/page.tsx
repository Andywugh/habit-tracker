'use client'

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useHabitStore } from '@/store/habitStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, Clock, TrendingUp, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes?: string | null
  created_at: string
}

interface Habit {
  id: string
  name: string
  icon: string
  type: 'positive' | 'negative'
  frequency?: {
    type: 'daily' | 'weekly'
    value?: number
  }
}

export default function HistoryPage() {
  const { user } = useAuthStore()
  const { habits, habitLogs, fetchHabits, fetchHabitLogs } = useHabitStore()
  const [loading, setLoading] = useState(true)
  const [selectedHabit, setSelectedHabit] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!user) {
      window.location.href = '/'
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchHabits(),
        fetchHabitLogs()
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 过滤记录
  const filteredLogs = habitLogs.filter(log => {
    const logDate = new Date(log.created_at)
    const isInSelectedMonth = logDate.getMonth() === selectedMonth.getMonth() && 
                             logDate.getFullYear() === selectedMonth.getFullYear()
    
    const matchesHabit = selectedHabit === 'all' || log.habit_id === selectedHabit
    
    const habit = habits.find(h => h.id === log.habit_id)
    const matchesSearch = !searchTerm || 
                         (habit?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return isInSelectedMonth && matchesHabit && matchesSearch
  })

  // 按日期分组记录
  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = new Date(log.created_at).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(log)
    return groups
  }, {} as Record<string, HabitLog[]>)

  // 生成日历数据
  const generateCalendarData = () => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendarDays = []
    
    // 添加上个月的日期
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      calendarDays.push({ date, isCurrentMonth: false, logs: [] })
    }
    
    // 添加当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toDateString()
      const logs = groupedLogs[dateString] || []
      calendarDays.push({ date, isCurrentMonth: true, logs })
    }
    
    // 添加下个月的日期以填满6周
    const remainingDays = 42 - calendarDays.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      calendarDays.push({ date, isCurrentMonth: false, logs: [] })
    }
    
    return calendarDays
  }

  const calendarData = generateCalendarData()

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">习惯记录历史</h1>
          <p className="text-gray-600">查看您的习惯完成记录和统计数据</p>
        </div>

        {/* 过滤器 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-2" />
                筛选习惯
              </label>
              <select
                value={selectedHabit}
                onChange={(e) => setSelectedHabit(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有习惯</option>
                {habits.map(habit => (
                  <option key={habit.id} value={habit.id}>
                    {habit.icon} {habit.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-2" />
                搜索习惯
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入习惯名称..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                选择月份
              </label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center font-medium">
                  {selectedMonth.getFullYear()}年{selectedMonth.getMonth() + 1}月
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 日历视图 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <Calendar className="h-5 w-5 inline mr-2" />
                日历视图
              </h2>
              
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarData.map((day, index) => {
                  const hasLogs = day.logs.length > 0
                  const isToday = day.date.toDateString() === new Date().toDateString()
                  
                  return (
                    <div
                      key={index}
                      className={clsx(
                        'aspect-square p-1 text-center text-sm border rounded-md transition-colors',
                        day.isCurrentMonth
                          ? 'text-gray-900'
                          : 'text-gray-400',
                        isToday && 'ring-2 ring-blue-500',
                        hasLogs
                          ? 'bg-green-100 border-green-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <div className="font-medium">{day.date.getDate()}</div>
                      {hasLogs && (
                        <div className="flex justify-center mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 记录列表 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <TrendingUp className="h-5 w-5 inline mr-2" />
                记录详情
              </h2>
              
              {Object.keys(groupedLogs).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>该月份暂无记录</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(groupedLogs)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, logs]) => (
                      <div key={date} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {new Date(date).toLocaleDateString('zh-CN', {
                              month: 'long',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </span>
                          <span className="text-sm text-gray-500">({logs.length}个记录)</span>
                        </div>
                        <div className="space-y-2">
                          {logs.map(log => {
                            const habit = habits.find(h => h.id === log.habit_id)
                            if (!habit) return null
                            
                            return (
                              <div
                                key={log.id}
                                className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md"
                              >
                                <div className="text-lg">{habit.icon}</div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{habit.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(log.created_at).toLocaleTimeString('zh-CN', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                                <span className={clsx(
                                  'px-2 py-1 text-xs rounded-full font-medium',
                                  habit.type === 'positive'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                )}>
                                  {habit.type === 'positive' ? '完成' : '避免'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 统计摘要 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredLogs.length}</div>
              <div className="text-sm text-gray-500">本月总记录</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(groupedLogs).length}
              </div>
              <div className="text-sm text-gray-500">活跃天数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {habits.filter(h => filteredLogs.some(log => log.habit_id === h.id)).length}
              </div>
              <div className="text-sm text-gray-500">涉及习惯</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.keys(groupedLogs).length > 0 
                  ? Math.round(filteredLogs.length / Object.keys(groupedLogs).length * 10) / 10
                  : 0
                }
              </div>
              <div className="text-sm text-gray-500">日均记录</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}