import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins } from 'lucide-react'
import { formatNumber } from '@/lib/utils/formatNumber'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'

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
          <span className="text-4xl font-bold">
            {formatNumber({ amount: coinBalance, settings })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

