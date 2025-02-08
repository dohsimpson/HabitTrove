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
export const DEFAULT_ADMIN_PASS = "admin"
export const DEFAULT_ADMIN_PASS_HASH = "4fd03f11af068acd8aa2bf8a38ce6ef7:bcf07a1776ba9fcb927fbcfb0eda933573f87e0852f8620b79c1da9242664856197f53109a94233cdaea7e6b08bf07713642f990739ff71480990f842809bd99" // "admin"