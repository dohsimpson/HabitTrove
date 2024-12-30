import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins } from 'lucide-react'

export default function CoinBalance({ coinBalance }: { coinBalance: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <Coins className="h-12 w-12 text-yellow-400 mr-4" />
          <span className="text-4xl font-bold">{coinBalance}</span>
        </div>
      </CardContent>
    </Card>
  )
}

