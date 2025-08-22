'use client'

import { habitsAtom, settingsAtom } from "@/lib/atoms";
import { Habit } from "@/lib/types";
import { useAtom } from "jotai";
import { DateTime } from "luxon";



type CompletionCache = {
  [dateKey: string]: {  // dateKey format: "YYYY-MM-DD"
    [habitId: string]: number  // number of completions on that date
  }
}


export default function DebugPage() {
  const [habits] = useAtom(habitsAtom);
  const [settings]  = useAtom(settingsAtom);

  function buildCompletionCache(habits: Habit[], timezone: string): CompletionCache {
    const cache: CompletionCache = {};

    habits.forEach(habit => {
      habit.completions.forEach(utcTimestamp => {
        // Convert UTC timestamp to local date string in specified timezone
        const localDate = DateTime
          .fromISO(utcTimestamp)
          .setZone(timezone)
          .toFormat('yyyy-MM-dd');

        if (!cache[localDate]) {
          cache[localDate] = {};
        }

        // Increment completion count for this habit on this date
        cache[localDate][habit.id] = (cache[localDate][habit.id] || 0) + 1;
      });
    });

    return cache;
  }

  function getCompletedHabitsForDate(
    habits: Habit[],
    date: DateTime,
    timezone: string,
    completionCache: CompletionCache
  ): Habit[] {
    const dateKey = date.setZone(timezone).toFormat('yyyy-MM-dd');
    const dateCompletions = completionCache[dateKey] || {};

    return habits.filter(habit => {
      const completionsNeeded = habit.targetCompletions || 1;
      const completionsAchieved = dateCompletions[habit.id] || 0;
      return completionsAchieved >= completionsNeeded;
    });
  }

  const habitCache = buildCompletionCache(habits.habits, settings.system.timezone);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Debug Page</h1>
      <div className="bg-gray-100 p-4 rounded break-all">
      </div>
    </div>
  );
}