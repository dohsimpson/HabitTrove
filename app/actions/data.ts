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
  getDefaultSettings,
  UserData,
  getDefaultUsersData,
  User,
  getDefaultWishlistData,
  getDefaultHabitsData,
  getDefaultCoinsData,
  Permission,
  ServerSettings
} from '@/lib/types'
import { d2t, deepMerge, getNow, checkPermission, uuid } from '@/lib/utils';
import { verifyPassword } from "@/lib/server-helpers";
import { saltAndHashPassword } from "@/lib/server-helpers";
import { signInSchema } from '@/lib/zod';
import { auth } from '@/auth';
import _ from 'lodash';
import { getCurrentUser, getCurrentUserId } from '@/lib/server-helpers'

import { PermissionError } from '@/lib/exceptions'

type ResourceType = 'habit' | 'wishlist' | 'coins'
type ActionType = 'write' | 'interact'


async function verifyPermission(
  resource: ResourceType,
  action: ActionType
): Promise<void> {
  // const user = await getCurrentUser()

  // if (!user) throw new PermissionError('User not authenticated')
  // if (user.isAdmin) return // Admins bypass permission checks
  
  // if (!checkPermission(user.permissions, resource, action)) {
  //   throw new PermissionError(`User does not have ${action} permission for ${resource}`)
  // }
  return
}

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
    const jsonData = JSON.parse(data) as T
    return jsonData
  } catch (error) {
    console.error(`Error loading ${type} data:`, error)
    return getDefaultData<T>(type)
  }
}

async function saveData<T>(type: DataType, data: T): Promise<void> {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

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
  const user = await getCurrentUser()
  if (!user) return getDefaultWishlistData()
  
  const data = await loadData<WishlistData>('wishlist')
  return {
    ...data,
    items: data.items.filter(x => user.isAdmin || x.userIds?.includes(user.id))
  }
}

export async function loadWishlistItems(): Promise<WishlistItemType[]> {
  const data = await loadWishlistData()
  return data.items
}

export async function saveWishlistItems(data: WishlistData): Promise<void> {
  await verifyPermission('wishlist', 'write')
  const user = await getCurrentUser()

  data.items = data.items.map(wishlist => ({
    ...wishlist,
    userIds: wishlist.userIds || (user ? [user.id] : undefined)
  }))

  if (!user?.isAdmin) {
    const existingData = await loadData<WishlistData>('wishlist')
    existingData.items = existingData.items.filter(x => user?.id && !x.userIds?.includes(user?.id))
    data.items = [
      ...existingData.items,
      ...data.items
    ]
  }

  return saveData('wishlist', data)
}

// Habits specific functions
export async function loadHabitsData(): Promise<HabitsData> {
  const user = await getCurrentUser()
  if (!user) return getDefaultHabitsData()
  const data = await loadData<HabitsData>('habits')
  return {
    ...data,
    habits: data.habits.filter(x => user.isAdmin || x.userIds?.includes(user.id))
  }
}

export async function saveHabitsData(data: HabitsData): Promise<void> {
  await verifyPermission('habit', 'write')
  
  const user = await getCurrentUser()
  // Create clone of input data
  const newData = _.cloneDeep(data)

  // Map habits with user IDs
  newData.habits = newData.habits.map(habit => ({
    ...habit,
    userIds: habit.userIds || (user ? [user.id] : undefined)
  }))

  if (!user?.isAdmin) {
    const existingData = await loadData<HabitsData>('habits')
    const existingHabits = existingData.habits.filter(x => user?.id && !x.userIds?.includes(user?.id))
    newData.habits = [
      ...existingHabits,
      ...newData.habits
    ]
  }

  return saveData('habits', newData)
}


// Coins specific functions
export async function loadCoinsData(): Promise<CoinsData> {
  try {
    const user = await getCurrentUser()
    if (!user) return getDefaultCoinsData()
    const data = await loadData<CoinsData>('coins')
    return {
      ...data,
      transactions: user.isAdmin ? data.transactions : data.transactions.filter(x => x.userId === user.id)
    }
  } catch {
    return getDefaultCoinsData()
  }
}

export async function saveCoinsData(data: CoinsData): Promise<void> {
  const user = await getCurrentUser()

  // Create clones of the data
  const newData = _.cloneDeep(data)
  newData.transactions = newData.transactions.map(transaction => ({
    ...transaction,
    userId: transaction.userId || user?.id
  }))

  if (!user?.isAdmin) {
    const existingData = await loadData<CoinsData>('coins')
    const existingTransactions = existingData.transactions.filter(x => user?.id && x.userId !== user.id)
    newData.transactions = [
      ...newData.transactions,
      ...existingTransactions
    ]
  }
  return saveData('coins', newData)
}

export async function addCoins({
  amount,
  description,
  type = 'MANUAL_ADJUSTMENT',
  relatedItemId,
  note,
  userId,
}: {
  amount: number
  description: string
  type?: TransactionType
  relatedItemId?: string
  note?: string
  userId?: string
}): Promise<CoinsData> {
  await verifyPermission('coins', type === 'MANUAL_ADJUSTMENT' ? 'write' : 'interact')
  const data = await loadCoinsData()
  const newTransaction: CoinTransaction = {
    id: uuid(),
    amount,
    type,
    description,
    timestamp: d2t({ dateTime: getNow({}) }),
    ...(relatedItemId && { relatedItemId }),
    ...(note && note.trim() !== '' && { note }),
    userId: userId || await getCurrentUserId()
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
    const user = await getCurrentUser()
    if (!user) return defaultSettings
    const data = await loadData<Settings>('settings')
    return { ...defaultSettings, ...data }
  } catch {
    return defaultSettings
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  return saveData('settings', settings)
}

export async function removeCoins({
  amount,
  description,
  type = 'MANUAL_ADJUSTMENT',
  relatedItemId,
  note,
  userId,
}: {
  amount: number
  description: string
  type?: TransactionType
  relatedItemId?: string
  note?: string
  userId?: string
}): Promise<CoinsData> {
  await verifyPermission('coins', type === 'MANUAL_ADJUSTMENT' ? 'write' : 'interact')
  const data = await loadCoinsData()
  const newTransaction: CoinTransaction = {
    id: uuid(),
    amount: -amount,
    type,
    description,
    timestamp: d2t({ dateTime: getNow({}) }),
    ...(relatedItemId && { relatedItemId }),
    ...(note && note.trim() !== '' && { note }),
    userId: userId || await getCurrentUserId()
  }

  const newData: CoinsData = {
    balance: Math.max(0, data.balance - amount),
    transactions: [newTransaction, ...data.transactions]
  }

  await saveCoinsData(newData)
  return newData
}

export async function uploadAvatar(formData: FormData): Promise<string> {
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

  return `/data/avatars/${filename}`
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

// user logic
export async function loadUsersData(): Promise<UserData> {
  try {
    return await loadData<UserData>('auth')
  } catch {
    return getDefaultUsersData()
  }
}

export async function saveUsersData(data: UserData): Promise<void> {
  return saveData('auth', data)
}

export async function getUser(username: string, plainTextPassword?: string): Promise<User | null> {
  const data = await loadUsersData()

  const user = data.users.find(user => user.username === username)
  if (!user) return null

  // Verify the plaintext password against the stored salt:hash
  const isValidPassword = verifyPassword(plainTextPassword, user.password)
  if (!isValidPassword) return null

  return user
}

export async function createUser(formData: FormData): Promise<User> {
  const username = formData.get('username') as string;
  let password = formData.get('password') as string | undefined;
  const avatarPath = formData.get('avatarPath') as string;
  const permissions = formData.get('permissions') ? 
    JSON.parse(formData.get('permissions') as string) as Permission[] : 
    undefined;

  if (password === null) password = undefined
  // Validate username and password against schema
  await signInSchema.parseAsync({ username, password });

  const data = await loadUsersData();

  // Check if username already exists
  if (data.users.some(user => user.username === username)) {
    throw new Error('Username already exists');
  }

  const hashedPassword = password ? saltAndHashPassword(password) : '';


  const newUser: User = {
    id: uuid(),
    username,
    password: hashedPassword,
    permissions,
    isAdmin: false,
    ...(avatarPath && { avatarPath })
  };

  const newData: UserData = {
    users: [...data.users, newUser]
  };

  await saveUsersData(newData);
  return newUser;
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'password'>>): Promise<User> {
  const data = await loadUsersData()
  const userIndex = data.users.findIndex(user => user.id === userId)

  if (userIndex === -1) {
    throw new Error('User not found')
  }

  // If username is being updated, check for duplicates
  if (updates.username) {
    const isDuplicate = data.users.some(
      user => user.username === updates.username && user.id !== userId
    )
    if (isDuplicate) {
      throw new Error('Username already exists')
    }
  }

  const updatedUser = {
    ...data.users[userIndex],
    ...updates
  }

  const newData: UserData = {
    users: [
      ...data.users.slice(0, userIndex),
      updatedUser,
      ...data.users.slice(userIndex + 1)
    ]
  }

  await saveUsersData(newData)
  return updatedUser
}

export async function updateUserPassword(userId: string, newPassword?: string): Promise<void> {
  const data = await loadUsersData()
  const userIndex = data.users.findIndex(user => user.id === userId)

  if (userIndex === -1) {
    throw new Error('User not found')
  }

  const hashedPassword = newPassword ? saltAndHashPassword(newPassword) : ''

  const updatedUser = {
    ...data.users[userIndex],
    password: hashedPassword
  }

  const newData: UserData = {
    users: [
      ...data.users.slice(0, userIndex),
      updatedUser,
      ...data.users.slice(userIndex + 1)
    ]
  }

  await saveUsersData(newData)
}

export async function deleteUser(userId: string): Promise<void> {
  const data = await loadUsersData()
  const userIndex = data.users.findIndex(user => user.id === userId)

  if (userIndex === -1) {
    throw new Error('User not found')
  }

  const newData: UserData = {
    users: [
      ...data.users.slice(0, userIndex),
      ...data.users.slice(userIndex + 1)
    ]
  }

  await saveUsersData(newData)
}

export async function loadServerSettings(): Promise<ServerSettings> {
  return {
    isDemo: !!process.env.DEMO,
  }
}
