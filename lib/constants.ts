import { CheckSquare, Target } from "lucide-react"

export const INITIAL_RECURRENCE_RULE = 'every day'
export const INITIAL_DUE = 'today'

export const RECURRENCE_RULE_MAP: { [key: string]: string } = {
  'daily': 'FREQ=DAILY',
  'weekly': 'FREQ=WEEKLY',
  'monthly': 'FREQ=MONTHLY',
  'yearly': 'FREQ=YEARLY',
  '': 'invalid',
}

export const DUE_MAP: { [key: string]: string } = {
  'tom': 'tomorrow',
  'tod': 'today',
  'yes': 'yesterday',
}

export const HabitIcon = Target
export const TaskIcon = CheckSquare;
export const QUICK_DATES = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'Monday', value: 'this monday' },
  { label: 'Tuesday', value: 'this tuesday' },
  { label: 'Wednesday', value: 'this wednesday' },
  { label: 'Thursday', value: 'this thursday' },
  { label: 'Friday', value: 'this friday' },
  { label: 'Saturday', value: 'this saturday' },
  { label: 'Sunday', value: 'this sunday' },
] as const

export const MAX_COIN_LIMIT = 9999