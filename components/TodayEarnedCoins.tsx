import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { useCoins } from '@/hooks/useCoins'
import { FormattedNumber } from '@/components/FormattedNumber'

export default function TodayEarnedCoins({ longFormat }: { longFormat?: boolean }) {
  const [settings] = useAtom(settingsAtom)
  const { coinsEarnedToday } = useCoins()

  if (coinsEarnedToday <= 0) return null

  return (
    <span className="text-md text-green-600 dark:text-green-400 font-medium mt-1">
      {"+"}
      <FormattedNumber amount={coinsEarnedToday} settings={settings} />
      {longFormat ?
        <span className="text-sm text-muted-foreground"> today</span>
        : null}
    </span>
  )
}
