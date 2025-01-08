import { formatNumber } from '@/lib/utils/formatNumber'
import { Settings } from '@/lib/types'

interface FormattedNumberProps {
  amount: number
  settings: Settings
  className?: string
}

export function FormattedNumber({ amount, settings, className }: FormattedNumberProps) {
  return (
    <span className={`break-all ${className || ''}`}>
      {formatNumber({ amount, settings })}
    </span>
  )
}
