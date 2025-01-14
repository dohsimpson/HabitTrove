'use client'

import { useState, useEffect } from 'react'
import { Habit } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export const POMODORO_TIME = 25 * 60 // 25 minutes
export const SHORT_BREAK = 5 * 60 // 5 minutes
export const LONG_BREAK = 15 * 60 // 15 minutes
export const POMODOROS_PER_SET = 4

interface PomodoroTimerProps {
  onClose: () => void
  habit?: Habit
  autoStart?: boolean
  onComplete?: () => void
}

export default function PomodoroTimer({ onClose, habit, autoStart = false, onComplete }: PomodoroTimerProps) {
  const targetCompletions = habit?.targetCompletions || POMODOROS_PER_SET
  const [startTime, setStartTime] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME)
  const [isActive, setIsActive] = useState(autoStart)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)
  const [cyclesCompleted, setCyclesCompleted] = useState(0)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isActive) {
      if (!startTime) {
        setStartTime(Date.now())
      }

      interval = setInterval(() => {
        if (!startTime) return

        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = (isBreak ? (pomodorosCompleted === POMODOROS_PER_SET - 1 ? LONG_BREAK : SHORT_BREAK) : POMODORO_TIME) - elapsed

        if (remaining <= 0) {
          handleTimerEnd()
        } else {
          setTimeLeft(remaining)
        }
      }, 200) // Check more frequently for better accuracy
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, startTime, isBreak, pomodorosCompleted])

  const handleTimerEnd = () => {
    setIsActive(false)
    setStartTime(null)

    if (!isBreak) {
      // Completed a pomodoro
      const newPomodorosCompleted = pomodorosCompleted + 1
      setPomodorosCompleted(newPomodorosCompleted)
      if (onComplete) {
        onComplete()
      }
      if (newPomodorosCompleted >= POMODOROS_PER_SET) {
        // Start long break
        setTimeLeft(LONG_BREAK)
        setPomodorosCompleted(0)
        setCyclesCompleted(cyclesCompleted + 1)
      } else {
        // Start short break
        setTimeLeft(SHORT_BREAK)
      }
    } else {
      // Break ended, start next pomodoro
      setTimeLeft(POMODORO_TIME)
    }
    setIsBreak(!isBreak)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  const startTimer = () => {
    setStartTime(Date.now())
    setIsActive(true)
  }

  const pauseTimer = () => {
    setIsActive(false)
    setStartTime(null)
  }

  const resetTimer = () => {
    setIsActive(false)
    setStartTime(null)
    setTimeLeft(POMODORO_TIME)
    setIsBreak(false)
    setPomodorosCompleted(0)
    setCyclesCompleted(0)
  }

  const progress = (timeLeft / (isBreak ? (pomodorosCompleted === POMODOROS_PER_SET - 1 ? LONG_BREAK : SHORT_BREAK) : POMODORO_TIME)) * 100

  return (
    <div className="flex flex-col items-center gap-4 p-4 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
      <div className="text-4xl font-bold">
        {formatTime(timeLeft)}
      </div>
      <div className="text-sm text-muted-foreground text-center">
        {habit && (
          <div className="font-medium mb-1 text-foreground">
            {habit.name}
          </div>
        )}
        {isBreak
          ? `Break ${pomodorosCompleted + 1}/${targetCompletions}`
          : `Pomodoro ${pomodorosCompleted + 1}/${targetCompletions}`
        }
      </div>
      <Progress value={progress} className="h-2 w-full" />
      <div className="flex gap-2">
        {isActive ? (
          <Button onClick={pauseTimer}>
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        ) : (
          <Button onClick={startTimer}>
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        )}
        <Button variant="outline" onClick={resetTimer}>
          <RotateCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  )
}
