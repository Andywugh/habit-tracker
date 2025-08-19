import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Check, Flame, Edit, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

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

interface HabitCardProps {
  habit: Habit
  isCompletedToday: boolean
  streakCount?: number
  onComplete: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  isCompletedToday, 
  streakCount = 0, 
  onComplete, 
  onEdit, 
  onDelete 
}) => {
  const [loading, setLoading] = React.useState(false)

  const handleComplete = async () => {
    if (isCompletedToday) return
    
    setLoading(true)
    try {
      await onComplete()
    } catch (error) {
      console.error('记录习惯失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{habit.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{habit.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={clsx(
                  'px-2 py-1 text-xs rounded-full',
                  habit.type === 'positive' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                )}>
                  {habit.type === 'positive' ? '积极习惯' : '消极习惯'}
                </span>
                {streakCount > 0 && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm font-medium">{streakCount}天</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            频率: {habit.frequency === 'daily' ? '每日' : 
                   habit.frequency === 'weekly' ? '每周' : '自定义'}
            {habit.reminder_time && (
              <span className="ml-2">提醒: {habit.reminder_time}</span>
            )}
          </div>
          
          <Button
            variant={isCompletedToday ? 'secondary' : 'primary'}
            size="sm"
            loading={loading}
            disabled={isCompletedToday}
            onClick={handleComplete}
          >
            {isCompletedToday ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                已完成
              </>
            ) : (
              '标记完成'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}