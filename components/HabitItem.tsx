import { Habit } from '@/lib/types'
import { useSettings } from '@/hooks/useSettings'
import { getTodayInTimezone } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Coins, Edit, Trash2, Check, Undo2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface HabitItemProps {
  habit: Habit
  onEdit: () => void
  onDelete: () => void
  onComplete: () => void
  onUndo: () => void
}

export default function HabitItem({ habit, onEdit, onDelete, onComplete, onUndo }: HabitItemProps) {
  const { settings } = useSettings()
  const today = getTodayInTimezone(settings.system.timezone)
  const isCompletedToday = habit.completions?.includes(today)
  const [isHighlighted, setIsHighlighted] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const highlightId = params.get('highlight')

    if (highlightId === habit.id) {
      setIsHighlighted(true)
      // Scroll the element into view after a short delay to ensure rendering
      setTimeout(() => {
        const element = document.getElementById(`habit-${habit.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      // Remove highlight after animation
      const timer = setTimeout(() => setIsHighlighted(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [habit.id])

  return (
    <Card 
      id={`habit-${habit.id}`}
      className={`transition-all duration-500 ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}
    >
      <CardHeader>
        <CardTitle>{habit.name}</CardTitle>
        <CardDescription>{habit.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">Frequency: {habit.frequency}</p>
        <div className="flex items-center mt-2">
          <Coins className="h-4 w-4 text-yellow-400 mr-1" />
          <span className="text-sm font-medium">{habit.coinReward} coins per completion</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={onEdit} className="mr-2">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isCompletedToday ? "secondary" : "default"}
            size="sm"
            onClick={onComplete}
            disabled={isCompletedToday}
          >
            <Check className="h-4 w-4 mr-2" />
            {isCompletedToday ? "Completed" : "Complete"}
          </Button>
          {isCompletedToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
            >
              <Undo2 />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

