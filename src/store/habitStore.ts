import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string
  type: 'positive' | 'negative'
  frequency: {
    type: 'daily' | 'weekly' | 'custom'
    days?: number[]
    count?: number
  }
  reminder_time: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes: string | null
  created_at: string
}

interface HabitState {
  habits: Habit[]
  habitLogs: HabitLog[]
  loading: boolean
  fetchHabits: () => Promise<void>
  createHabit: (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ error: any }>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<{ error: any }>
  deleteHabit: (id: string) => Promise<{ error: any }>
  logHabit: (habitId: string, notes?: string) => Promise<{ error: any }>
  fetchHabitLogs: (habitId?: string) => Promise<void>
  getStreakCount: (habitId: string) => number
  getTodayStatus: (habitId: string) => boolean
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  habitLogs: [],
  loading: false,

  fetchHabits: async () => {
    set({ loading: true })
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (data && !error) {
      set({ habits: data })
    }
    
    set({ loading: false })
  },

  createHabit: async (habitData) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: { message: '用户未登录' } }
    }

    const { data, error } = await supabase
      .from('habits')
      .insert({
        ...habitData,
        user_id: user.id,
      })
      .select()
      .single()
    
    if (data && !error) {
      const { habits } = get()
      set({ habits: [data, ...habits] })
    }
    
    return { error }
  },

  updateHabit: async (id, updates) => {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (data && !error) {
      const { habits } = get()
      const updatedHabits = habits.map(habit => 
        habit.id === id ? { ...habit, ...data } : habit
      )
      set({ habits: updatedHabits })
    }
    
    return { error }
  },

  deleteHabit: async (id) => {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', id)
    
    if (!error) {
      const { habits } = get()
      const filteredHabits = habits.filter(habit => habit.id !== id)
      set({ habits: filteredHabits })
    }
    
    return { error }
  },

  logHabit: async (habitId, notes) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: { message: '用户未登录' } }
    }

    const today = new Date().toISOString().split('T')[0]
    
    // 检查今天是否已经记录
    const { data: existingLog } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`)
      .single()
    
    if (existingLog) {
      return { error: { message: '今天已经记录过了' } }
    }

    const { data, error } = await supabase
      .from('habit_logs')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        completed_at: new Date().toISOString(),
        notes,
      })
      .select()
      .single()
    
    if (data && !error) {
      const { habitLogs } = get()
      set({ habitLogs: [data, ...habitLogs] })
    }
    
    return { error }
  },

  fetchHabitLogs: async (habitId) => {
    const query = supabase
      .from('habit_logs')
      .select('*')
      .order('completed_at', { ascending: false })
    
    if (habitId) {
      query.eq('habit_id', habitId)
    }
    
    const { data, error } = await query
    
    if (data && !error) {
      set({ habitLogs: data })
    }
  },

  getStreakCount: (habitId) => {
    const { habitLogs } = get()
    const logs = habitLogs
      .filter(log => log.habit_id === habitId)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].completed_at)
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      
      if (logDate.toDateString() === expectedDate.toDateString()) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  },

  getTodayStatus: (habitId) => {
    const { habitLogs } = get()
    const today = new Date().toDateString()
    
    return habitLogs.some(log => 
      log.habit_id === habitId && 
      new Date(log.completed_at).toDateString() === today
    )
  },
}))