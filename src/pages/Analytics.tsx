import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Calendar, Target, Award, Activity, Clock } from 'lucide-react'

interface HabitStats {
  habit_id: string
  habit_name: string
  total_logs: number
  completion_rate: number
  current_streak: number
  best_streak: number
}

interface WeeklyData {
  week: string
  completed: number
  total: number
  rate: number
}

interface HabitTypeData {
  name: string
  value: number
  color: string
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

const Analytics: React.FC = () => {
  const { user } = useAuthStore()
  const [habitStats, setHabitStats] = useState<HabitStats[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [habitTypeData, setHabitTypeData] = useState<HabitTypeData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalHabits, setTotalHabits] = useState(0)
  const [totalLogs, setTotalLogs] = useState(0)
  const [averageCompletion, setAverageCompletion] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  useEffect(() => {
    if (user) {
      fetchAnalyticsData()
    }
  }, [user])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // 获取习惯统计数据
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id)

      if (habits) {
        setTotalHabits(habits.length)

        // 计算习惯类型分布
        const typeStats = habits.reduce((acc, habit) => {
          acc[habit.type] = (acc[habit.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const typeData: HabitTypeData[] = [
          { name: '积极习惯', value: typeStats.positive || 0, color: '#10b981' },
          { name: '消极习惯', value: typeStats.negative || 0, color: '#ef4444' }
        ]
        setHabitTypeData(typeData)

        // 获取每个习惯的详细统计
        const statsPromises = habits.map(async (habit) => {
          const { data: logs } = await supabase
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habit.id)
            .order('completed_at', { ascending: false })

          const totalLogs = logs?.length || 0
          const daysSinceCreated = Math.ceil(
            (new Date().getTime() - new Date(habit.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )
          const completionRate = daysSinceCreated > 0 ? (totalLogs / daysSinceCreated) * 100 : 0

          // 计算当前连续天数
          let currentStreak = 0
          let bestStreak = 0
          let tempStreak = 0

          if (logs && logs.length > 0) {
            const sortedLogs = logs.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
            let currentDate = new Date()
            currentDate.setHours(0, 0, 0, 0)

            for (const log of sortedLogs) {
              const logDate = new Date(log.completed_at)
              logDate.setHours(0, 0, 0, 0)

              if (logDate.getTime() === currentDate.getTime()) {
                currentStreak++
                tempStreak++
                currentDate.setDate(currentDate.getDate() - 1)
              } else if (logDate.getTime() === currentDate.getTime() + 24 * 60 * 60 * 1000) {
                tempStreak++
                currentDate.setDate(currentDate.getDate() - 1)
              } else {
                if (tempStreak > bestStreak) {
                  bestStreak = tempStreak
                }
                tempStreak = 1
                currentDate = new Date(logDate)
                currentDate.setDate(currentDate.getDate() - 1)
              }
            }

            if (tempStreak > bestStreak) {
              bestStreak = tempStreak
            }
          }

          return {
            habit_id: habit.id,
            habit_name: habit.name,
            total_logs: totalLogs,
            completion_rate: Math.min(completionRate, 100),
            current_streak: currentStreak,
            best_streak: bestStreak
          }
        })

        const stats = await Promise.all(statsPromises)
        setHabitStats(stats)

        // 计算总体统计
        const totalLogsCount = stats.reduce((sum, stat) => sum + stat.total_logs, 0)
        setTotalLogs(totalLogsCount)

        const avgCompletion = stats.length > 0 
          ? stats.reduce((sum, stat) => sum + stat.completion_rate, 0) / stats.length 
          : 0
        setAverageCompletion(avgCompletion)

        const maxStreak = Math.max(...stats.map(stat => stat.best_streak), 0)
        setBestStreak(maxStreak)
      }

      // 获取最近7周的数据
      const weeklyStats = []
      for (let i = 6; i >= 0; i--) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (i * 7))
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        const { data: weekLogs } = await supabase
          .from('habit_logs')
          .select('*')
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString())
          .eq('user_id', user?.id)

        const completed = weekLogs?.length || 0
        const total = (habits?.length || 0) * 7 // 假设每天都应该完成所有习惯
        const rate = total > 0 ? (completed / total) * 100 : 0

        weeklyStats.push({
          week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          completed,
          total,
          rate: Math.round(rate)
        })
      }

      setWeeklyData(weeklyStats)
    } catch (error) {
      console.error('获取分析数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg text-gray-600">加载分析数据中...</div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          进度分析
        </h1>
        <p className="text-gray-600">
          深入了解您的习惯养成进展和趋势
        </p>
      </div>

      {/* 总体统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总习惯数</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalHabits}</div>
            <p className="text-xs text-gray-600">正在追踪</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总完成次数</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalLogs}</div>
            <p className="text-xs text-gray-600">累计打卡</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均完成率</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(averageCompletion)}%
            </div>
            <p className="text-xs text-gray-600">整体表现</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最佳连续</CardTitle>
            <Award className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{bestStreak}</div>
            <p className="text-xs text-gray-600">天数记录</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 周完成率趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>周完成率趋势</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, '完成率']}
                    labelFormatter={(label) => `第 ${label} 周`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 习惯类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>习惯类型分布</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={habitTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {habitTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 习惯详细统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span>习惯完成率对比</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="habit_name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${Math.round(Number(value))}%`, '完成率']}
                />
                <Bar 
                  dataKey="completion_rate" 
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 习惯详细列表 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>习惯详细统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">习惯名称</th>
                  <th className="text-center py-2">总完成次数</th>
                  <th className="text-center py-2">完成率</th>
                  <th className="text-center py-2">当前连续</th>
                  <th className="text-center py-2">最佳连续</th>
                </tr>
              </thead>
              <tbody>
                {habitStats.map((stat) => (
                  <tr key={stat.habit_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{stat.habit_name}</td>
                    <td className="text-center py-3">{stat.total_logs}</td>
                    <td className="text-center py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        stat.completion_rate >= 80 
                          ? 'bg-green-100 text-green-800'
                          : stat.completion_rate >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(stat.completion_rate)}%
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <span className="font-semibold text-blue-600">
                        {stat.current_streak} 天
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <span className="font-semibold text-orange-600">
                        {stat.best_streak} 天
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default Analytics