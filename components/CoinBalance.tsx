import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins } from 'lucide-react'
import { FormattedNumber } from '@/components/FormattedNumber'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { settingsAtom } from '@/lib/atoms'
import dynamic from 'next/dynamic'

const TodayEarnedCoins = dynamic(() => import('./TodayEarnedCoins'), { ssr: false })

export default function CoinBalance({ coinBalance }: { coinBalance: number }) {
  const t = useTranslations('CoinBalance');
  const [settings] = useAtom(settingsAtom)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('coinBalanceTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <Coins className="h-12 w-12 text-yellow-400 mr-4" />
          <div className="flex flex-col">
            <div className="flex flex-col">
              <span className="text-4xl font-bold">
                <FormattedNumber amount={coinBalance} settings={settings} />
              </span>
              <div className="flex items-center gap-1">
                <TodayEarnedCoins longFormat={true} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

