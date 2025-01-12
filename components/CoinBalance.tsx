import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins } from 'lucide-react'
import { FormattedNumber } from '@/components/FormattedNumber'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import dynamic from 'next/dynamic'

const TodayEarnedCoins = dynamic(() => import('./TodayEarnedCoins'), { ssr: false })

export default function CoinBalance({ coinBalance }: { coinBalance: number }) {
  const [settings] = useAtom(settingsAtom)
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
              <FormattedNumber amount={coinBalance} settings={settings} />
            </span>
            <TodayEarnedCoins />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

