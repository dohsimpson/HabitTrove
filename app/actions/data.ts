'use server'

import fs from 'fs/promises'
import path from 'path'
import {
  HabitsData,
  CoinsData,
  CoinTransaction,
  TransactionType,
  WishlistItemType,
  WishlistData,
  Settings,
  DataType,
  DATA_DEFAULTS,
  getDefaultSettings
} from '@/lib/types'
import { d2t, getNow } from '@/lib/utils';

function getDefaultData<T>(type: DataType): T {
  return DATA_DEFAULTS[type]() as T;
}

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
      // File doesn't exist, create it with default data
      const initialData = getDefaultData(type)
      await fs.writeFile(filePath, JSON.stringify(initialData, null, 2))
      return initialData as T
    }

    // File exists, read and return its contents
    const data = await fs.readFile(filePath, 'utf8')
    const jsonData = JSON.parse(data)
    return jsonData
  } catch (error) {
    console.error(`Error loading ${type} data:`, error)
    return getDefaultData<T>(type)
  }
}

async function saveData<T>(type: DataType, data: T): Promise<void> {
  try {
    await ensureDataDir()
    const filePath = path.join(process.cwd(), 'data', `${type}.json`)
    const saveData = data
    await fs.writeFile(filePath, JSON.stringify(saveData, null, 2))
  } catch (error) {
    console.error(`Error saving ${type} data:`, error)
  }
}

// Wishlist specific functions
export async function loadWishlistData(): Promise<WishlistData> {
  return loadData<WishlistData>('wishlist')
}

export async function loadWishlistItems(): Promise<WishlistItemType[]> {
  const data = await loadWishlistData()
  return data.items
}

export async function saveWishlistItems(items: WishlistItemType[]): Promise<void> {
  return saveData('wishlist', { items })
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
    timestamp: d2t({ dateTime: getNow({}) }),
    ...(relatedItemId && { relatedItemId })
  }

  const newData: CoinsData = {
    balance: data.balance + amount,
    transactions: [newTransaction, ...data.transactions]
  }

  await saveCoinsData(newData)
  return newData
}

export async function loadSettings(): Promise<Settings> {
  const defaultSettings = getDefaultSettings()

  try {
    const data = await loadData<Settings>('settings')
    return { ...defaultSettings, ...data }
  } catch {
    return defaultSettings
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  return saveData('settings', settings)
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
    timestamp: d2t({ dateTime: getNow({}) }),
    ...(relatedItemId && { relatedItemId })
  }

  const newData: CoinsData = {
    balance: Math.max(0, data.balance - amount),
    transactions: [newTransaction, ...data.transactions]
  }

  await saveCoinsData(newData)
  return newData
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get('avatar') as File
  if (!file) throw new Error('No file provided')
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    throw new Error('File size must be less than 5MB')
  }

  // Create avatars directory if it doesn't exist
  const avatarsDir = path.join(process.cwd(), 'data', 'avatars')
  await fs.mkdir(avatarsDir, { recursive: true })

  // Generate unique filename
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const filePath = path.join(avatarsDir, filename)

  // Save file
  const buffer = await file.arrayBuffer()
  await fs.writeFile(filePath, Buffer.from(buffer))

  // Update settings with new avatar path
  const settings = await loadSettings()
  const newSettings = {
    ...settings,
    profile: {
      ...settings.profile,
      avatarPath: `/data/avatars/${filename}`
    }
  }

  await saveSettings(newSettings)
  return newSettings;
}

export async function getChangelog(): Promise<string> {
  try {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
    return await fs.readFile(changelogPath, 'utf8')
  } catch (error) {
    console.error('Error loading changelog:', error)
    return '# Changelog\n\nNo changelog available.'
  }
}
