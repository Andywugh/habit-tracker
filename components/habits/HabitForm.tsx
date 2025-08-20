import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { clsx } from 'clsx'

interface Habit {
  id: string
  name: string
  icon: string
  type: 'positive' | 'negative'
  frequency: {
    type: 'daily' | 'weekly' | 'custom'
    days?: number[]
    count?: number
  }
  reminder_time?: string | null
  user_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

interface HabitFormProps {
  isOpen: boolean
  onClose: () => void
  habit?: Habit | null
  onSave: (habitData: any) => Promise<void>
}

const HABIT_ICONS = [
  '🏃', '💪', '📚', '🧘', '💧', '🥗', '😴', '🚭', '📱', '🎯',
  '✍️', '🎵', '🎨', '🌱', '🧹', '💰', '👥', '🎮', '📺', '🍔'
]

const FREQUENCY_TYPES = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' }
]

export const HabitForm: React.FC<HabitFormProps> = ({ isOpen, onClose, habit, onSave }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: '🎯',
    type: 'positive' as 'positive' | 'negative',
    frequency: { type: 'daily' as 'daily' | 'weekly' | 'custom' },
    reminder_time: '',
  })

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name,
        icon: habit.icon,
        type: habit.type,
        frequency: habit.frequency,
        reminder_time: habit.reminder_time || '',
      })
    } else {
      setFormData({
        name: '',
        icon: '🎯',
        type: 'positive',
        frequency: { type: 'daily' },
        reminder_time: '',
      })
    }
  }, [habit, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('保存习惯失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit ? '编辑习惯' : '创建新习惯'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            label="习惯名称"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="输入习惯名称"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择图标
          </label>
          <div className="grid grid-cols-10 gap-2">
            {HABIT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={clsx(
                  'p-2 text-2xl rounded-lg border-2 hover:bg-gray-50 transition-colors',
                  formData.icon === icon
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200'
                )}
                onClick={() => handleInputChange('icon', icon)}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            习惯类型
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="positive"
                checked={formData.type === 'positive'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">积极习惯（要培养的）</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="negative"
                checked={formData.type === 'negative'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">消极习惯（要戒除的）</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            频率
          </label>
          <select
            value={formData.frequency.type}
            onChange={(e) => handleInputChange('frequency', { type: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            {FREQUENCY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="提醒时间（可选）"
            type="time"
            value={formData.reminder_time}
            onChange={(e) => handleInputChange('reminder_time', e.target.value)}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {habit ? '更新习惯' : '创建习惯'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}