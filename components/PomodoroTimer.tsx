'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useHabits } from '@/hooks/useHabits'
import { habitsAtom, pomodoroAtom, pomodoroTodayCompletionsAtom, settingsAtom } from '@/lib/atoms'
import { cn } from '@/lib/utils'
import { useAtom } from 'jotai'
import { Clock, Minus, Pause, Play, RotateCw, SkipForward, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PomoConfig {
  labels: string[]
  duration: number
  type: 'focus' | 'break'
}

const PomoConfigs: Record<PomoConfig['type'], PomoConfig> = {
  focus: {
    labels: [
      'Stay Focused',
      'You Got This',
      'Keep Going',
      'Crush It',
      'Make It Happen',
      'Stay Strong',
      'Push Through',
      'One Step at a Time',
      'You Can Do It',
      'Focus and Conquer'
    ],
    duration: 25 * 60,
    type: 'focus',
  },
  break: {
    labels: [
      'Take a Break',
      'Relax and Recharge',
      'Breathe Deeply',
      'Stretch It Out',
      'Refresh Yourself',
      'You Deserve This',
      'Recharge Your Energy',
      'Step Away for a Bit',
      'Clear Your Mind',
      'Rest and Rejuvenate'
    ],
    duration: 5 * 60,
    type: 'break',
  },
}

export default function PomodoroTimer() {
  const [settings] = useAtom(settingsAtom)
  const [pomo, setPomo] = useAtom(pomodoroAtom)
  const { show, selectedHabitId, autoStart, minimized } = pomo
  const [habitsData] = useAtom(habitsAtom)
  const { completeHabit } = useHabits()
  const selectedHabit = selectedHabitId ? habitsData.habits.find(habit => habit.id === selectedHabitId) : null
  const [timeLeft, setTimeLeft] = useState(PomoConfigs.focus.duration)
  const [state, setState] = useState<'started' | 'stopped' | 'paused'>(autoStart ? 'started' : 'stopped')
  const wakeLock = useRef<WakeLockSentinel | null>(null)
  const [todayCompletions] = useAtom(pomodoroTodayCompletionsAtom)
  const currentTimer = useRef<PomoConfig>(PomoConfigs.focus)
  const [currentLabel, setCurrentLabel] = useState(
    currentTimer.current.labels[Math.floor(Math.random() * currentTimer.current.labels.length)]
  )

  // Handle wake lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if (!('wakeLock' in navigator)) {
          console.debug('Browser does not support wakelock')
          return
        }
        if (wakeLock.current && !wakeLock.current.released) {
          console.debug('Wake lock already in use')
          return
        }
        if (state === 'started') {
          // acquire wake lock
          wakeLock.current = await navigator.wakeLock.request('screen')
          return
        }
      } catch (err) {
        console.error('Error requesting wake lock:', err)
      }
    }

    const releaseWakeLock = async () => {
      try {
        if (wakeLock.current) {
          await wakeLock.current.release()
          wakeLock.current = null
        }
      } catch (err) {
        console.error('Error releasing wake lock:', err)
      }
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        await releaseWakeLock();
      } else if (document.visibilityState === 'visible') {
        // Always update indicator when tab becomes visible
        if (state === 'started') {
          await requestWakeLock();
        }
      }
    };

    if (state === 'started') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      requestWakeLock()
    }

    // return handles all other states
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock()
    }
  }, [state])

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (state === 'started') {
      // Calculate the target end time based on current timeLeft
      const targetEndTime = Date.now() + timeLeft * 1000

      interval = setInterval(() => {
        const remaining = Math.floor((targetEndTime - Date.now()) / 1000)

        if (remaining <= 0) {
          setState("stopped")
          const currentTimerType = currentTimer.current.type
          currentTimer.current = currentTimerType === 'focus' ? PomoConfigs.break : PomoConfigs.focus
          setTimeLeft(currentTimer.current.duration)
          setCurrentLabel(
            currentTimer.current.labels[Math.floor(Math.random() * currentTimer.current.labels.length)]
          )

          // update habits only after focus sessions
          if (selectedHabit && currentTimerType === 'focus') {
            completeHabit(selectedHabit)
            // The atom will automatically update with the new completions
          }
        } else {
          setTimeLeft(remaining)
        }
      }, 1000)
    }

    // return handles any other states
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [state, timeLeft, completeHabit, selectedHabit])

  const toggleTimer = () => {
    setState(prev => prev === 'started' ? 'paused' : 'started')
  }

  const resetTimer = () => {
    setState("stopped")
    setTimeLeft(currentTimer.current.duration)
  }

  const skipTimer = () => {
    currentTimer.current = currentTimer.current.type === 'focus'
      ? PomoConfigs.break
      : PomoConfigs.focus
    resetTimer()
    setCurrentLabel(
      currentTimer.current.labels[Math.floor(Math.random() * currentTimer.current.labels.length)]
    )
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  const progress = (timeLeft / currentTimer.current.duration) * 100

  if (!show) return null

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-4 bg-background border rounded-lg shadow-lg">
      {minimized ? (
        // minimized version
        <div
          className="p-2 cursor-pointer relative overflow-hidden"
          onClick={() => setPomo(prev => ({ ...prev, minimized: false }))}
        >
          <div className="flex items-center gap-2 font-bold">
            <Clock className="h-4 w-4" />
            <div className="text-sm">
              {formatTime(timeLeft)}
            </div>
          </div>
          {/* Progress bar as bottom border */}
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : (
        // full version
        <div className="flex flex-col items-center gap-4 p-4 relative">
          <div className="absolute top-2 right-4 flex gap-2">
            <button
              onClick={() => setPomo(prev => ({ ...prev, minimized: true }))}
              className="text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              // terminate the timer
              onClick={() => setPomo(prev => ({ ...prev, show: false }))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="text-4xl font-bold">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-center">
              {selectedHabit && (
                <div className="mb-2 flex justify-center">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-none',
                      // order matters here
                      currentTimer.current.type === 'focus' && 'bg-green-500',
                      state === 'started' && 'animate-pulse',
                      state === 'paused' && 'bg-yellow-500',
                      state === 'stopped' && 'bg-red-500',
                      currentTimer.current.type === 'break' && 'bg-blue-500',
                    )} />
                    <div className="font-bold text-foreground">
                      {selectedHabit.name}
                    </div>
                  </div>
                </div>
              )}
              <span>{currentTimer.current.type.charAt(0).toUpperCase() + currentTimer.current.type.slice(1)}: {currentLabel}</span>
              {selectedHabit && selectedHabit.targetCompletions && selectedHabit.targetCompletions > 1 && (
                <div className="flex justify-center gap-1 mt-2">
                  {(() => {
                    // Show up to 7 items, but no more than the target completions
                    const maxItems = Math.min(7, selectedHabit.targetCompletions)
                    // Calculate start position to center current completion
                    const start = Math.max(0, Math.min(todayCompletions - Math.floor(maxItems / 2), selectedHabit.targetCompletions - maxItems))

                    return Array.from({ length: maxItems }).map((_, i) => {
                      const cycle = start + i
                      const isCompleted = cycle < todayCompletions
                      const isCurrent = cycle === todayCompletions
                      return (
                        <div
                          key={cycle}
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center border',
                            isCompleted
                              ? 'bg-green-500 border-green-600 text-white'
                              : isCurrent
                                ? 'border-2 border-green-500 text-muted-foreground'
                                : 'border-muted-foreground text-muted-foreground'
                          )}
                        >
                          {cycle + 1}
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
            <Progress value={progress} className="h-2 w-full" />
            <div className="flex gap-2">
              <Button onClick={toggleTimer} className="sm:px-4">
                {state === "started" ? (
                  <>
                    <Pause className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Start</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={resetTimer}
                disabled={state === "started"}
                className="sm:px-4"
              >
                <RotateCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <Button
                variant="outline"
                onClick={skipTimer}
                disabled={state === "started"}
                className="sm:px-4"
              >
                <SkipForward className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Skip</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
