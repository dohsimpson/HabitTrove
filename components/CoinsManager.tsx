'use client'

import { FormattedNumber } from '@/components/FormattedNumber'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCoins } from '@/hooks/useCoins'
import { settingsAtom, usersAtom } from '@/lib/atoms'
import { useHelpers } from '@/lib/client-helpers'
import { d2s, t2d } from '@/lib/utils'
import { useAtom } from 'jotai'
import { History } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import { useEffect, useRef, useState } from 'react'; // Import useEffect, useRef
import EmptyState from './EmptyState'
import { TransactionNoteEditor } from './TransactionNoteEditor'

export default function CoinsManager() {
  const { currentUser } = useHelpers()
  const [selectedUser, setSelectedUser] = useState<string>()
  const {
    add,
    remove,
    updateNote,
    balance,
    transactions,
    coinsEarnedToday,
    totalEarned,
    totalSpent,
    coinsSpentToday,
    transactionsToday
  } = useCoins({selectedUser})
  const [settings] = useAtom(settingsAtom)
  const [usersData] = useAtom(usersAtom)
  const DEFAULT_AMOUNT = '0'
  const [amount, setAmount] = useState(DEFAULT_AMOUNT)
  const [pageSize, setPageSize] = useState(50)
  const [currentPage, setCurrentPage] = useState(1)
  const [note, setNote] = useState('')
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const userIdFromQuery = searchParams.get('user') // Get user ID from query
  const transactionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Effect to set selected user from query param if admin
  useEffect(() => {
    if (currentUser?.isAdmin && userIdFromQuery && userIdFromQuery !== selectedUser) {
      // Check if the user ID from query exists in usersData
      if (usersData.users.some(u => u.id === userIdFromQuery)) {
        setSelectedUser(userIdFromQuery);
      }
    }
    // Only run when userIdFromQuery or currentUser changes, avoid re-running on selectedUser change within this effect
  }, [userIdFromQuery, currentUser, usersData.users, selectedUser]);

  // Effect to scroll to highlighted transaction
  useEffect(() => {
    if (highlightId && transactionRefs.current[highlightId]) {
      transactionRefs.current[highlightId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightId, transactions]); // Re-run if highlightId or transactions change

  const handleSaveNote = async (transactionId: string, note: string) => {
    await updateNote(transactionId, note)
  }

  const handleDeleteNote = async (transactionId: string) => {
    await updateNote(transactionId, '')
  }

  const handleAddRemoveCoins = async () => {
    const numAmount = Number(amount)
    if (numAmount > 0) {
      await add(numAmount, "Manual addition", note)
      setAmount(DEFAULT_AMOUNT)
      setNote('')
    } else if (numAmount < 0) {
      await remove(Math.abs(numAmount), "Manual removal", note)
      setAmount(DEFAULT_AMOUNT)
      setNote('')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mr-6">Coins Management</h1>
        {currentUser?.isAdmin && (
          <select
            className="border rounded p-2"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            {usersData.users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl animate-bounce hover:animate-none cursor-default">💰</span>
              <div>
                <div className="text-sm font-normal text-muted-foreground">Current Balance</div>
                <div className="text-3xl font-bold"><FormattedNumber amount={balance} settings={settings} /> coins</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
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

                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAddRemoveCoins}
                      className="flex-1 h-14 transition-colors flex items-center justify-center font-medium"
                      variant="default"
                    >
                      <div className="flex items-center gap-2">
                        {Number(amount) >= 0 ? 'Add Coins' : 'Remove Coins'}
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Top Row - Totals */}
              <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900">
                <div className="text-sm text-green-800 dark:text-green-100 mb-1">Total Earned</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-50">
                  <FormattedNumber amount={totalEarned} settings={settings} /> 🪙
                </div>
              </div>

              <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900">
                <div className="text-sm text-red-800 dark:text-red-100 mb-1">Total Spent</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-50">
                  <FormattedNumber amount={totalSpent} settings={settings} /> 💸
                </div>
              </div>

              <div className="p-4 rounded-lg bg-pink-100 dark:bg-pink-900">
                <div className="text-sm text-pink-800 dark:text-pink-100 mb-1">Total Transactions</div>
                <div className="text-2xl font-bold text-pink-900 dark:text-pink-50">
                  {transactions.length} 📈
                </div>
              </div>

              {/* Bottom Row - Today */}
              <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900">
                <div className="text-sm text-blue-800 dark:text-blue-100 mb-1">Today's Earned</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-50">
                  <FormattedNumber amount={coinsEarnedToday} settings={settings} /> 🪙
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900">
                <div className="text-sm text-purple-800 dark:text-purple-100 mb-1">Today's Spent</div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-50">
                  <FormattedNumber amount={coinsSpentToday} settings={settings} /> 💸
                </div>
              </div>

              <div className="p-4 rounded-lg bg-orange-100 dark:bg-orange-900">
                <div className="text-sm text-orange-800 dark:text-orange-100 mb-1">Today's Transactions</div>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-50">
                  {transactionsToday} 📊
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <select
                    className="border rounded p-1"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1) // Reset to first page when changing page size
                    }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                  </select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, transactions.length)} to {Math.min(currentPage * pageSize, transactions.length)} of {transactions.length} entries
                </div>
              </div>

              {transactions.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No transactions yet"
                  description="Your transaction history will appear here once you start earning or spending coins"
                />
              ) : (
                <>
                  {transactions
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((transaction) => {
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

                      const isHighlighted = transaction.id === highlightId;
                      return (
                        <div
                          key={transaction.id}
                          ref={(el) => { transactionRefs.current[transaction.id] = el; }} // Assign ref correctly
                          className={`flex justify-between items-center p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            isHighlighted ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : '' // Apply highlight styles
                          }`}
                        >
                          <div className="space-y-1 flex-grow mr-4"> {/* Added flex-grow and margin */}
                            <div className="flex items-center gap-2 flex-wrap"> {/* Added flex-wrap */}
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
                              {transaction.userId && currentUser?.isAdmin && (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={usersData.users.find(u => u.id === transaction.userId)?.avatarPath ?
                                      `/api/avatars/${usersData.users.find(u => u.id === transaction.userId)?.avatarPath?.split('/').pop()}` : undefined}
                                    alt={usersData.users.find(u => u.id === transaction.userId)?.username}
                                  />
                                  <AvatarFallback>
                                    {usersData.users.find(u => u.id === transaction.userId)?.username?.[0] || '?'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {d2s({ dateTime: t2d({ timestamp: transaction.timestamp, timezone: settings.system.timezone }), timezone: settings.system.timezone })}
                            </p>
                            <TransactionNoteEditor
                              transactionId={transaction.id}
                              initialNote={transaction.note}
                              onSave={handleSaveNote}
                              onDelete={handleDeleteNote}
                            />
                          </div>
                          <div className="flex-shrink-0 text-right"> {/* Ensure amount stays on the right */}
                            <span
                              className={`font-mono ${transaction.amount >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}
                            >
                              {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                  <div className="flex justify-center items-center gap-4 mt-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        «
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        ‹
                      </Button>
                      <div className="flex items-center gap-1 px-4 py-2 rounded-md bg-muted">
                        <span className="text-sm font-medium">Page</span>
                        <span className="text-sm font-bold">{currentPage}</span>
                        <span className="text-sm font-medium">of</span>
                        <span className="text-sm font-bold">{Math.ceil(transactions.length / pageSize)}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(transactions.length / pageSize), prev + 1))}
                        disabled={currentPage >= Math.ceil(transactions.length / pageSize)}
                      >
                        ›
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.ceil(transactions.length / pageSize))}
                        disabled={currentPage >= Math.ceil(transactions.length / pageSize)}
                      >
                        »
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  )
}
