'use server'

import fs from 'fs/promises'
import path from 'path'
import { HabitsData, CoinsData, CoinTransaction, TransactionType, WishlistItemType } from '@/lib/types'

type DataType = 'wishlist' | 'habits' | 'coins'

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function loadData<T>(type: DataType): Promise<T> {
  try {
    await ensureDataDir()
    const filePath = path.join(process.cwd(), 'data', `${type}.json`)

    try {
      await fs.access(filePath)
    } catch {
      // File doesn't exist, create it with initial data
      const initialData = type === 'wishlist'
        ? { items: [] }
        : type === 'habits'
          ? { habits: [] }
          : { balance: 0, transactions: [] }

      await fs.writeFile(filePath, JSON.stringify(initialData, null, 2))
      return initialData as T
    }

    // File exists, read and return its contents
    const data = await fs.readFile(filePath, 'utf8')
    const jsonData = JSON.parse(data)
    return type === 'wishlist' ? jsonData.items : jsonData
  } catch (error) {
    console.error(`Error loading ${type} data:`, error)
    if (type === 'wishlist') return [] as T
    if (type === 'habits') return { habits: [] } as T
    if (type === 'coins') return { balance: 0, transactions: [] } as T
    return {} as T
  }
}

async function saveData<T>(type: DataType, data: T): Promise<void> {
  try {
    await ensureDataDir()
    const filePath = path.join(process.cwd(), 'data', `${type}.json`)
    const saveData = type === 'wishlist' ? { items: data } : data
    await fs.writeFile(filePath, JSON.stringify(saveData, null, 2))
  } catch (error) {
    console.error(`Error saving ${type} data:`, error)
  }
}

// Wishlist specific functions
export async function loadWishlistItems(): Promise<WishlistItemType[]> {
  return loadData<WishlistItemType[]>('wishlist')
}

export async function saveWishlistItems(items: WishlistItemType[]): Promise<void> {
  return saveData('wishlist', items)
}

// Habits specific functions
export async function loadHabitsData(): Promise<HabitsData> {
  return loadData<HabitsData>('habits')
}

export async function saveHabitsData(data: HabitsData): Promise<void> {
  return saveData('habits', data)
}

// Coins specific functions
export async function loadCoinsData(): Promise<CoinsData> {
  try {
    return await loadData<CoinsData>('coins')
  } catch {
    return { balance: 0, transactions: [] }
  }
}

export async function saveCoinsData(data: CoinsData): Promise<void> {
  return saveData('coins', data)
}

export async function addCoins(
  amount: number,
  description: string,
  type: TransactionType = 'MANUAL_ADJUSTMENT',
  relatedItemId?: string
): Promise<CoinsData> {
  const data = await loadCoinsData()
  const newTransaction: CoinTransaction = {
    id: crypto.randomUUID(),
    amount,
    type,
    description,
    timestamp: new Date().toISOString(),
    ...(relatedItemId && { relatedItemId })
  }

  const newData: CoinsData = {
    balance: data.balance + amount,
    transactions: [newTransaction, ...data.transactions]
  }

  await saveCoinsData(newData)
  return newData
}

export async function removeCoins(
  amount: number,
  description: string,
  type: TransactionType = 'MANUAL_ADJUSTMENT',
  relatedItemId?: string
): Promise<CoinsData> {
  const data = await loadCoinsData()
  const newTransaction: CoinTransaction = {
    id: crypto.randomUUID(),
    amount: -amount,
    type,
    description,
    timestamp: new Date().toISOString(),
    ...(relatedItemId && { relatedItemId })
  }

  const newData: CoinsData = {
    balance: Math.max(0, data.balance - amount),
    transactions: [newTransaction, ...data.transactions]
  }

  await saveCoinsData(newData)
  return newData
}
