import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins } from 'lucide-react'
import { formatNumber } from '@/lib/utils/formatNumber'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { useCoins } from '@/hooks/useCoins'

export default function CoinBalance({ coinBalance }: { coinBalance: number }) {
  const [settings] = useAtom(settingsAtom)
  const { coinsEarnedToday } = useCoins()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <Coins className="h-12 w-12 text-yellow-400 mr-4" />
          <div className="flex flex-col">
            <span className="text-4xl font-bold">
              {formatNumber({ amount: coinBalance, settings })}
            </span>
            {coinsEarnedToday > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-md text-green-600 dark:text-green-400 font-medium">
                  +{formatNumber({ amount: coinsEarnedToday, settings })}
                </span>
                <span className="text-md text-muted-foreground">
                  today
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

