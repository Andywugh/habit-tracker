import React, { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { HabitCard } from '../components/habits/HabitCard'
import { HabitForm } from '../components/habits/HabitForm'
import { Button } from '../components/ui/Button'

import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Plus, Target, TrendingUp, Calendar, Award, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

type Page = 'dashboard' | 'analytics' | 'settings'

interface Habit {
  id: string
  name: string
  icon: string
  type: 'positive' | 'negative'
  frequency: 'daily' | 'weekly'
  reminder_time?: string
  user_id: string
  created_at: string
  updated_at: string
}

interface HabitLog {
  id: string
  habit_id: string
  completed_at: string
  user_id: string
}

interface DashboardProps {
  onNavigate?: (page: Page) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuthStore()
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  useEffect(() => {
    if (user) {
      fetchHabits()
      fetchTodayLogs()
    }
  }, [user])

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHabits(data || [])
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .gte('completed_at', `${today}T00:00:00.000Z`)
        .lt('completed_at', `${today}T23:59:59.999Z`)

      if (error) throw error
      setHabitLogs(data || [])
    } catch (error) {
      console.error('Error fetching today logs:', error)
    }
  }

  const handleHabitComplete = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habitId,
          user_id: user?.id,
          completed_at: new Date().toISOString()
        })

      if (error) throw error
      fetchTodayLogs()
    } catch (error) {
      console.error('Error completing habit:', error)
    }
  }

  const getStreakCount = (habitId: string): number => {
    // 简单实现，返回固定值，实际应该计算连续天数
    return 7
  }

  const handleCompleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habitId,
          user_id: user?.id,
          completed_at: new Date().toISOString()
        })

      if (error) throw error
      fetchTodayLogs()
    } catch (error) {
      console.error('Error completing habit:', error)
    }
  }

  const handleSaveHabit = async (habitData: any) => {
    try {
      if (editingHabit) {
        const { error } = await supabase
          .from('habits')
          .update(habitData)
          .eq('id', editingHabit.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('habits')
          .insert({
            ...habitData,
            user_id: user?.id
          })
        if (error) throw error
      }
      setShowHabitForm(false)
      setEditingHabit(null)
      fetchHabits()
    } catch (error) {
      console.error('Error saving habit:', error)
    }
  }

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    setShowHabitForm(true)
  }

  const handleDeleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId)

      if (error) throw error
      fetchHabits()
    } catch (error) {
      console.error('Error deleting habit:', error)
    }
  }

  const getTodayStats = () => {
    const totalHabits = habits.length
    const completedToday = habitLogs.length
    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0
    
    return { totalHabits, completedToday, completionRate }
  }

  const { totalHabits, completedToday, completionRate } = getTodayStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <Layout currentPage="dashboard" onNavigate={onNavigate}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          欢迎回来！
        </h1>
        <p className="text-gray-600">
          今天是 {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>
      {/* 今日概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{completedToday}</div>
             <p className="text-xs text-gray-600">
               共 {habits.length} 个习惯
             </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完成率</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
               {habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0}%
             </div>
            <p className="text-xs text-gray-600">
              今日完成率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃习惯</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{habits.length}</div>
            <p className="text-xs text-gray-600">
              正在追踪
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周目标</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">85%</div>
            <p className="text-xs text-gray-600">
              目标完成率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 习惯列表 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">今日习惯</h2>
        <Button
          onClick={() => setShowHabitForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>添加习惯</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">加载中...</div>
        </div>
      ) : habits.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              还没有任何习惯
            </h3>
            <p className="text-gray-600 mb-6">
              开始创建您的第一个习惯，踏上自我提升的旅程！
            </p>
            <Button onClick={() => setShowHabitForm(true)}>
              创建第一个习惯
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => (
             <HabitCard
               key={habit.id}
               habit={habit}
               isCompletedToday={habitLogs.some(
                 log => log.habit_id === habit.id && 
                 new Date(log.completed_at).toDateString() === new Date().toDateString()
               )}
               streakCount={getStreakCount(habit.id)}
               onComplete={() => handleCompleteHabit(habit.id)}
               onEdit={() => handleEditHabit(habit)}
               onDelete={() => handleDeleteHabit(habit.id)}
             />
           ))}
        </div>
      )}
      {/* 习惯表单 */}
      <HabitForm
        isOpen={showHabitForm}
        onClose={() => {
          setShowHabitForm(false)
          setEditingHabit(null)
        }}
        habit={editingHabit}
        onSave={handleSaveHabit}
      />
    </Layout>
  )
}

export default Dashboard