'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCw, Minus, X, Clock, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { settingsAtom, pomodoroAtom, habitsAtom, pomodoroTodayCompletionsAtom } from '@/lib/atoms'
// import { getCompletionsForDate, getTodayInTimezone } from '@/lib/utils' // Not used after pomodoroTodayCompletionsAtom
import { useHabits } from '@/hooks/useHabits'

interface PomoConfig {
  getLabels: () => string[]
  duration: number
  type: 'focus' | 'break'
}

export default function PomodoroTimer() {
  const t = useTranslations('PomodoroTimer')

  const PomoConfigs: Record<PomoConfig['type'], PomoConfig> = {
    focus: {
      getLabels: () => [
        t('focusLabel1'), t('focusLabel2'), t('focusLabel3'), t('focusLabel4'), t('focusLabel5'),
        t('focusLabel6'), t('focusLabel7'), t('focusLabel8'), t('focusLabel9'), t('focusLabel10')
      ],
      duration: 25 * 60,
      type: 'focus',
    },
    break: {
      getLabels: () => [
        t('breakLabel1'), t('breakLabel2'), t('breakLabel3'), t('breakLabel4'), t('breakLabel5'),
        t('breakLabel6'), t('breakLabel7'), t('breakLabel8'), t('breakLabel9'), t('breakLabel10')
      ],
      duration: 5 * 60,
      type: 'break',
    },
  }

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
  const currentTimerRef = useRef<PomoConfig>(PomoConfigs.focus)
  const [currentLabel, setCurrentLabel] = useState(() => {
    const labels = currentTimerRef.current.getLabels();
    return labels[Math.floor(Math.random() * labels.length)];
  });


  // Handle wake lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if (!('wakeLock' in navigator)) {
          console.debug(t('wakeLockNotSupported'))
          return
        }
        if (wakeLock.current && !wakeLock.current.released) {
          console.debug(t('wakeLockInUse'))
          return
        }
        if (state === 'started') {
          // acquire wake lock
          wakeLock.current = await navigator.wakeLock.request('screen')
          return
        }
      } catch (err) {
        console.error(t('wakeLockRequestError'), err)
      }
    }

    const releaseWakeLock = async () => {
      try {
        if (wakeLock.current) {
          await wakeLock.current.release()
          wakeLock.current = null
        }
      } catch (err) {
        console.error(t('wakeLockReleaseError'), err)
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
          handleTimerEnd()
        } else {
          setTimeLeft(remaining)
        }
      }, 1000)
    }

    // return handles any other states
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [state])

  const handleTimerEnd = async () => {
    setState("stopped")
    const currentTimerType = currentTimerRef.current.type
    currentTimerRef.current = currentTimerType === 'focus' ? PomoConfigs.break : PomoConfigs.focus
    setTimeLeft(currentTimerRef.current.duration)
    const newLabels = currentTimerRef.current.getLabels();
    setCurrentLabel(newLabels[Math.floor(Math.random() * newLabels.length)])

    // update habits only after focus sessions
    if (selectedHabit && currentTimerType === 'focus') {
      await completeHabit(selectedHabit)
      // The atom will automatically update with the new completions
    }
  }

  const toggleTimer = () => {
    setState(prev => prev === 'started' ? 'paused' : 'started')
  }

  const resetTimer = () => {
    setState("stopped")
    setTimeLeft(currentTimerRef.current.duration)
  }

  const skipTimer = () => {
    currentTimerRef.current = currentTimerRef.current.type === 'focus'
      ? PomoConfigs.break
      : PomoConfigs.focus
    resetTimer() // This will also reset timeLeft to the new timer's duration
    const newLabels = currentTimerRef.current.getLabels();
    setCurrentLabel(newLabels[Math.floor(Math.random() * newLabels.length)])
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  const progress = (timeLeft / currentTimerRef.current.duration) * 100

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
                      currentTimerRef.current.type === 'focus' && 'bg-green-500',
                      state === 'started' && 'animate-pulse',
                      state === 'paused' && 'bg-yellow-500',
                      state === 'stopped' && 'bg-red-500',
                      currentTimerRef.current.type === 'break' && 'bg-blue-500',
                    )} />
                    <div className="font-bold text-foreground">
                      {selectedHabit.name}
                    </div>
                  </div>
                </div>
              )}
              <span>
                {currentTimerRef.current.type === 'focus' ? t('focusType') : t('breakType')}: {currentLabel}
              </span>
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
                    <span className="hidden sm:inline">{t('pauseButton')}</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('startButton')}</span>
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
                <span className="hidden sm:inline">{t('resetButton')}</span>
              </Button>
              <Button
                variant="outline"
                onClick={skipTimer}
                disabled={state === "started"}
                className="sm:px-4"
              >
                <SkipForward className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('skipButton')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
