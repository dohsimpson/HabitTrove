export const INITIAL_RECURRENCE_RULE = 'daily'

export const RECURRENCE_RULE_MAP: { [key: string]: string } = {
  'daily': 'FREQ=DAILY',
  'weekly': 'FREQ=WEEKLY',
  'monthly': 'FREQ=MONTHLY',
  'yearly': 'FREQ=YEARLY',
  '': 'invalid',
}

