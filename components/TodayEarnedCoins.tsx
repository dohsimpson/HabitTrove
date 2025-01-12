import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { useCoins } from '@/hooks/useCoins'
import { FormattedNumber } from '@/components/FormattedNumber'

export default function TodayEarnedCoins() {
  const [settings] = useAtom(settingsAtom)
  const { coinsEarnedToday } = useCoins()

  if (coinsEarnedToday <= 0) return null

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-md text-green-600 dark:text-green-400 font-medium">
        {"+"}
        <FormattedNumber amount={coinsEarnedToday} settings={settings} />
      </span>
      <span className="text-md text-muted-foreground">
        today
      </span>
    </div>
  )
}
