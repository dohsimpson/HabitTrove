import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// This would typically come from your backend or state management
const rewards = [
  { id: '1', name: 'Day off work', coinCost: 500 },
  { id: '2', name: 'Movie night', coinCost: 100 },
  { id: '3', name: 'New book', coinCost: 50 },
]

interface RewardProgressProps {
  coinBalance: number
}

export default function RewardProgress({ coinBalance }: RewardProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Towards Rewards</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rewards.map((reward) => {
            const progress = Math.min((coinBalance / reward.coinCost) * 100, 100)
            return (
              <div key={reward.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{reward.name}</span>
                  <span className="text-sm font-medium">{coinBalance}/{reward.coinCost} coins</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

