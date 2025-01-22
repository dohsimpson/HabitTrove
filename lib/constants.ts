import { CheckSquare, Target } from "lucide-react"

export const INITIAL_RECURRENCE_RULE = 'daily'
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
