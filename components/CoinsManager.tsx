'use client'

import { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils/formatNumber'
import { History } from 'lucide-react'
import EmptyState from './EmptyState'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { useCoins } from '@/hooks/useCoins'
import { format } from 'date-fns'
import Link from 'next/link'

export default function CoinsManager() {
  const { balance, transactions, addAmount, removeAmount } = useCoins()
  const { settings } = useSettings()
  const DEFAULT_AMOUNT = '0'
  const [amount, setAmount] = useState(DEFAULT_AMOUNT)

  const handleAddCoins = async () => {
    const data = await addAmount(Number(amount), "Manual addition")
    if (data) {
      setAmount(DEFAULT_AMOUNT)
      toast({ title: "Success", description: `Added ${amount} coins` })
    }
  }

  const handleRemoveCoins = async () => {
    const data = await removeAmount(Math.abs(Number(amount)), "Manual removal")
    if (data) {
      setAmount(DEFAULT_AMOUNT)
      toast({ title: "Success", description: `Removed ${amount} coins` })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Coins Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl animate-bounce hover:animate-none cursor-default">🪙</span>
              <div>
                <div className="text-sm font-normal text-muted-foreground">Current Balance</div>
                <div className="text-3xl font-bold">{formatNumber({ amount: balance, settings })} coins</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 text-lg"
                  onClick={() => setAmount(prev => (Number(prev) - 1).toString())}
                >
                  -
                </Button>
                <div className="relative w-32">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-center text-xl font-medium h-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    🪙
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 text-lg"
                  onClick={() => setAmount(prev => (Number(prev) + 1).toString())}
                >
                  +
                </Button>
              </div>

              <Button
                onClick={() => {
                  const numAmount = Number(amount);
                  if (numAmount > 0) {
                    handleAddCoins();
                  } else if (numAmount < 0) {
                    handleRemoveCoins();
                  }
                }}
                className="w-full h-14 transition-colors flex items-center justify-center font-medium"
                variant="default"
              >
                <div className="flex items-center gap-2">
                  {Number(amount) >= 0 ? 'Add Coins' : 'Remove Coins'}
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900">
                <div className="text-sm text-green-800 dark:text-green-100 mb-1">Total Earned</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-50">
                  {formatNumber({
                    amount: transactions
                      .filter(t => {
                        if (t.type === 'HABIT_COMPLETION' && t.relatedItemId) {
                          return !transactions.some(undoT =>
                            undoT.type === 'HABIT_UNDO' &&
                            undoT.relatedItemId === t.relatedItemId
                          )
                        }
                        return t.amount > 0 && t.type !== 'HABIT_UNDO'
                      })
                      .reduce((sum, t) => sum + t.amount, 0)
                    , settings
                  })} 🪙
                </div>
              </div>

              <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900">
                <div className="text-sm text-red-800 dark:text-red-100 mb-1">Total Spent</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-50">
                  {formatNumber({
                    amount: Math.abs(
                      transactions
                        .filter(t => t.type === 'WISH_REDEMPTION' || t.type === 'MANUAL_ADJUSTMENT')
                        .reduce((sum, t) => sum + (t.amount < 0 ? t.amount : 0), 0)
                    ), settings
                  })} 🪙
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900">
                <div className="text-sm text-blue-800 dark:text-blue-100 mb-1">Today's Transactions</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-50">
                  {transactions.filter(t =>
                    new Date(t.timestamp).toDateString() === new Date().toDateString()
                  ).length} 📊
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Transaction History</span>
              <span className="text-sm font-normal text-muted-foreground">
                Total: {transactions.length} transactions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No transactions yet"
                  description="Your transaction history will appear here once you start earning or spending coins"
                />
              ) : (
                transactions.map((transaction) => {
                  const getBadgeStyles = () => {
                    switch (transaction.type) {
                      case 'HABIT_COMPLETION':
                        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      case 'HABIT_UNDO':
                        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      case 'WISH_REDEMPTION':
                        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
                      case 'MANUAL_ADJUSTMENT':
                        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      default:
                        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                    }
                  }

                  return (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {transaction.relatedItemId ? (
                            <Link
                              href={`${transaction.type === 'WISH_REDEMPTION' ? '/wishlist' : '/habits'}?highlight=${transaction.relatedItemId}`}
                              className="font-medium hover:underline"
                              scroll={true}
                            >
                              {transaction.description}
                            </Link>
                          ) : (
                            <p className="font-medium">{transaction.description}</p>
                          )}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getBadgeStyles()}`}
                          >
                            {transaction.type.split('_').join(' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {format(new Date(transaction.timestamp), 'PPpp')}
                        </p>
                      </div>
                      <span
                        className={`font-mono ${transaction.amount >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                          }`}
                      >
                        {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
