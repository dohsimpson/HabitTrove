'use client'

import HeatMap from '@uiw/react-heat-map'
import { Habit } from '@/lib/types'

interface HabitHeatmapProps {
  habits: Habit[]
}

export default function HabitHeatmap({ habits }: HabitHeatmapProps) {
  // Aggregate all habit completions into a count per day
  const completionCounts = habits.reduce((acc: { [key: string]: number }, habit) => {
    habit.completions.forEach(date => {
      // Convert date format from ISO (YYYY-MM-DD) to YYYY/MM/DD for the heatmap
      const formattedDate = date.replace(/-/g, '/')
      acc[formattedDate] = (acc[formattedDate] || 0) + 1
    })
    return acc
  }, {})

  // Convert to the format expected by the heatmap
  const value = Object.entries(completionCounts).map(([date, count]) => ({
    date,
    count
  }))

  // Get start date (30 days ago)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Habit Completion Heatmap</h2>
      <div className="overflow-x-auto">
        <HeatMap
          value={value}
          startDate={startDate}
          width={500}
          style={{ color: '#047857' }}
          panelColors={[
            '#f0fdf4',  // Very light green
            '#dcfce7',  // Light green
            '#bbf7d0',  // Medium light green
            '#86efac',  // Medium green
            '#4ade80',  // Bright green
            '#22c55e'   // Dark green
          ]}
          rectProps={{ rx: 3 }} // Rounded corners
          rectRender={(props, data) => {
            return (
              <title>{`${data.date}: ${data.count || 0} habits completed`}</title>
            );
          }}
        />
      </div>
    </div>
  )
}
