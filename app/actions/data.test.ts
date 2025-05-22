import { deleteUser, loadData, saveData, loadUsersData, saveUsersData } from './data';
import fs from 'fs/promises';
import { auth } from '@/auth'; // Import auth to be mocked
import {
  WishlistData,
  HabitsData,
  CoinsData,
  UserData,
  User,
  WishlistItemType,
  Habit,
  CoinTransaction,
  DATA_DEFAULTS,
  getDefaultUsersData,
  getDefaultWishlistData,
  getDefaultHabitsData,
  getDefaultCoinsData,
} from '@/lib/types';

// Mock fs/promises
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock @/auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));
const mockedAuth = auth as jest.MockedFunction<typeof auth>;

// Mock getCurrentUser which is used internally by saveData, loadData etc.
// It's not directly in data.ts but data.ts functions call it.
jest.mock('@/lib/server-helpers', () => ({
  ...jest.requireActual('@/lib/server-helpers'), // Keep original implementations for other functions
  getCurrentUser: jest.fn(),
  getCurrentUserId: jest.fn(),
}));

// Helper to mock file content
const mockFileData = (dataType: keyof typeof DATA_DEFAULTS, data: any) => {
  mockedFs.readFile.mockImplementation(async (filePath) => {
    const fileName = filePath.toString().split('/').pop();
    if (fileName === `${dataType}.json`) {
      return JSON.stringify(data);
    }
    // Fallback for other files if any are read, though our mocks should be specific
    const defaultDataKey = fileName?.replace('.json', '') as keyof typeof DATA_DEFAULTS | undefined;
    if (defaultDataKey && DATA_DEFAULTS[defaultDataKey]) {
      return JSON.stringify(DATA_DEFAULTS[defaultDataKey]());
    }
    throw new Error(`readFile mock not configured for ${filePath}`);
  });
};

// Helper to get saved data
let savedDataStore: { [key: string]: any } = {};
mockedFs.writeFile.mockImplementation(async (filePath, data) => {
  const fileName = filePath.toString().split('/').pop();
  if (fileName) {
    savedDataStore[fileName] = JSON.parse(data as string);
  }
});


describe('deleteUser', () => {
  // Default mock for getCurrentUser to allow saveData/loadData to "work"
  // Specific tests might override this if admin behavior is tested.
  const mockRegularUser: User = {
    id: 'user-to-keep-session',
    username: 'activeUser',
    isAdmin: false,
    permissions: [],
  };

  beforeEach(()
 => {
    jest.clearAllMocks();
    savedDataStore = {}; // Reset saved data for each test

    // Mock auth session for most tests
    mockedAuth.mockResolvedValue({
      user: { id: 'user-to-keep-session', email: 'active@example.com', name: 'Active User' },
      expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
    // Mock getCurrentUser for functions in data.ts
    const { getCurrentUser } = require('@/lib/server-helpers');
    (getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser);


    // Default mock for readFile to return default data for all types
    // This prevents tests from failing if they call loadData unexpectedly
    // Individual tests will override this for specific data types they care about
    mockedFs.readFile.mockImplementation(async (filePath) => {
      const fileName = filePath.toString().split('/').pop()?.replace('.json', '');
      if (fileName && DATA_DEFAULTS[fileName as keyof typeof DATA_DEFAULTS]) {
        return JSON.stringify(DATA_DEFAULTS[fileName as keyof typeof DATA_DEFAULTS]());
      }
      // A default empty object for any other unexpected file reads
      return JSON.stringify({});
    });
    mockedFs.access.mockResolvedValue(undefined); // Assume files exist
  });

  test('should delete a user and their associated transactions, then recalculate balance', async () => {
    const userIdToDelete = 'user123';
    const initialAuthData: UserData = {
      users: [
        { id: userIdToDelete, username: 'testUser', isAdmin: false, permissions: [] },
        { id: 'user456', username: 'anotherUser', isAdmin: false, permissions: [] },
      ],
    };
    const initialCoinsData: CoinsData = {
      balance: 150,
      transactions: [
        { id: 't1', userId: userIdToDelete, amount: 100, description: 'tx1', type: 'ADD', timestamp: 'ts1' },
        { id: 't2', userId: 'user456', amount: 50, description: 'tx2', type: 'ADD', timestamp: 'ts2' },
        { id: 't3', userId: userIdToDelete, amount: -20, description: 'tx3', type: 'REMOVE', timestamp: 'ts3' },
      ],
    };

    mockFileData('auth', initialAuthData);
    mockFileData('coins', initialCoinsData);
    mockFileData('wishlist', getDefaultWishlistData()); // Default empty for this test
    mockFileData('habits', getDefaultHabitsData());   // Default empty for this test

    await deleteUser(userIdToDelete);

    expect(savedDataStore['auth.json'].users).toHaveLength(1);
    expect(savedDataStore['auth.json'].users.find((u: User) => u.id === userIdToDelete)).toBeUndefined();
    expect(savedDataStore['coins.json'].transactions).toHaveLength(1);
    expect(savedDataStore['coins.json'].transactions.find((t: CoinTransaction) => t.userId === userIdToDelete)).toBeUndefined();
    expect(savedDataStore['coins.json'].balance).toBe(50); // 50 from user456
  });

  test('should remove a wishlist item if the user is the sole owner', async () => {
    const userIdToDelete = 'user123';
    const initialAuthData: UserData = { users: [{ id: userIdToDelete, username: 'testUser', isAdmin: false, permissions: [] }] };
    const initialWishlistData: WishlistData = {
      items: [
        { id: 'w1', name: 'Item 1', userIds: [userIdToDelete], price: 10, url: '', description: '' },
        { id: 'w2', name: 'Item 2', userIds: ['user456'], price: 20, url: '', description: '' },
      ],
    };

    mockFileData('auth', initialAuthData);
    mockFileData('wishlist', initialWishlistData);
    mockFileData('coins', getDefaultCoinsData());
    mockFileData('habits', getDefaultHabitsData());

    await deleteUser(userIdToDelete);

    expect(savedDataStore['wishlist.json'].items).toHaveLength(1);
    expect(savedDataStore['wishlist.json'].items.find((item: WishlistItemType) => item.id === 'w1')).toBeUndefined();
    expect(savedDataStore['wishlist.json'].items.find((item: WishlistItemType) => item.id === 'w2')).toBeDefined();
  });

  test('should remove user from a wishlist item if shared, item remains', async () => {
    const userIdToDelete = 'user123';
    const otherUserId = 'user456';
    const initialAuthData: UserData = { users: [{ id: userIdToDelete, username: 'testUser', isAdmin: false, permissions: [] }] };
    const initialWishlistData: WishlistData = {
      items: [
        { id: 'w1', name: 'Shared Item', userIds: [userIdToDelete, otherUserId], price: 10, url: '', description: '' },
      ],
    };

    mockFileData('auth', initialAuthData);
    mockFileData('wishlist', initialWishlistData);
    mockFileData('coins', getDefaultCoinsData());
    mockFileData('habits', getDefaultHabitsData());

    await deleteUser(userIdToDelete);

    expect(savedDataStore['wishlist.json'].items).toHaveLength(1);
    const updatedItem = savedDataStore['wishlist.json'].items.find((item: WishlistItemType) => item.id === 'w1');
    expect(updatedItem).toBeDefined();
    expect(updatedItem.userIds).toEqual([otherUserId]);
  });

  test('should remove a habit if the user is the sole owner', async () => {
    const userIdToDelete = 'user123';
    const initialAuthData: UserData = { users: [{ id: userIdToDelete, username: 'testUser', isAdmin: false, permissions: [] }] };
    const initialHabitsData: HabitsData = {
      habits: [
        { id: 'h1', name: 'Habit 1', userIds: [userIdToDelete], frequency: 'daily', period: 'day', targetCompletions: 1, completions: [] },
        { id: 'h2', name: 'Habit 2', userIds: ['user456'], frequency: 'daily', period: 'day', targetCompletions: 1, completions: [] },
      ],
      completions: [],
    };
    
    mockFileData('auth', initialAuthData);
    mockFileData('habits', initialHabitsData);
    mockFileData('coins', getDefaultCoinsData());
    mockFileData('wishlist', getDefaultWishlistData());

    await deleteUser(userIdToDelete);

    expect(savedDataStore['habits.json'].habits).toHaveLength(1);
    expect(savedDataStore['habits.json'].habits.find((habit: Habit) => habit.id === 'h1')).toBeUndefined();
    expect(savedDataStore['habits.json'].habits.find((habit: Habit) => habit.id === 'h2')).toBeDefined();
  });

  test('should remove user from a habit if shared, habit remains', async () => {
    const userIdToDelete = 'user123';
    const otherUserId = 'user456';
    const initialAuthData: UserData = { users: [{ id: userIdToDelete, username: 'testUser', isAdmin: false, permissions: [] }] };
    const initialHabitsData: HabitsData = {
      habits: [
        { id: 'h1', name: 'Shared Habit', userIds: [userIdToDelete, otherUserId], frequency: 'daily', period: 'day', targetCompletions: 1, completions: [] },
      ],
      completions: [],
    };

    mockFileData('auth', initialAuthData);
    mockFileData('habits', initialHabitsData);
    mockFileData('coins', getDefaultCoinsData());
    mockFileData('wishlist', getDefaultWishlistData());

    await deleteUser(userIdToDelete);

    expect(savedDataStore['habits.json'].habits).toHaveLength(1);
    const updatedHabit = savedDataStore['habits.json'].habits.find((habit: Habit) => habit.id === 'h1');
    expect(updatedHabit).toBeDefined();
    expect(updatedHabit.userIds).toEqual([otherUserId]);
  });

  test('should throw an error if trying to delete a non-existent user', async () => {
    const userIdToDelete = 'nonexistentUser';
    const initialAuthData: UserData = {
      users: [{ id: 'user123', username: 'testUser', isAdmin: false, permissions: [] }],
    };

    mockFileData('auth', initialAuthData);
    // No need to mock other files as it should fail before touching them
    mockFileData('coins', getDefaultCoinsData());
    mockFileData('wishlist', getDefaultWishlistData());
    mockFileData('habits', getDefaultHabitsData());

    await expect(deleteUser(userIdToDelete)).rejects.toThrow('User not found');
    // Ensure no data was saved
    expect(savedDataStore['auth.json']).toBeUndefined();
    expect(savedDataStore['coins.json']).toBeUndefined();
    expect(savedDataStore['wishlist.json']).toBeUndefined();
    expect(savedDataStore['habits.json']).toBeUndefined();
  });
  
  test('should handle empty data files gracefully (loadData provides defaults)', async () => {
    const userIdToDelete = 'user123';
    const initialAuthData: UserData = {
      users: [{ id: userIdToDelete, username: 'testUser', isAdmin: false, permissions: [] }],
    };

    // Simulate files not existing or being empty by making readFile return default empty data
    mockFileData('auth', initialAuthData); // User must exist in auth
    mockFileData('coins', getDefaultCoinsData());
    mockFileData('wishlist', getDefaultWishlistData());
    mockFileData('habits', getDefaultHabitsData());

    // We also need to ensure fs.access for non-existent files makes loadData create them
    // The default beforeEach already mocks fs.access to resolve (meaning file exists)
    // To test the "file doesn't exist" path in loadData, we'd need to make fs.access throw for some.
    // However, the current deleteUser logic loads all data first. If auth.json is fine,
    // the others will be loaded (or created with defaults by loadData if they don't exist).
    
    await deleteUser(userIdToDelete);

    // Check that user is deleted from auth
    expect(savedDataStore['auth.json'].users).toHaveLength(0);

    // Check that other files are saved with default (empty) states,
    // as there was no data to modify for the deleted user.
    expect(savedDataStore['coins.json'].balance).toBe(0);
    expect(savedDataStore['coins.json'].transactions).toEqual([]);
    expect(savedDataStore['wishlist.json'].items).toEqual([]);
    expect(savedDataStore['habits.json'].habits).toEqual([]);
    expect(savedDataStore['habits.json'].completions).toEqual([]);
  });

  test('should correctly process if user has no wishlist items or habits', async () => {
    const userIdToDelete = 'user123';
    const initialAuthData: UserData = {
      users: [{ id: userIdToDelete, username: 'testUser', isAdmin: false, permissions: [] }],
    };
    const initialCoinsData: CoinsData = {
      balance: 100,
      transactions: [
        { id: 't1', userId: userIdToDelete, amount: 100, description: 'tx1', type: 'ADD', timestamp: 'ts1' },
      ],
    };

    mockFileData('auth', initialAuthData);
    mockFileData('coins', initialCoinsData);
    mockFileData('wishlist', getDefaultWishlistData()); // Empty wishlist
    mockFileData('habits', getDefaultHabitsData());     // Empty habits

    await deleteUser(userIdToDelete);

    expect(savedDataStore['auth.json'].users).toHaveLength(0);
    expect(savedDataStore['coins.json'].balance).toBe(0);
    expect(savedDataStore['coins.json'].transactions).toEqual([]);
    expect(savedDataStore['wishlist.json'].items).toEqual([]);
    expect(savedDataStore['habits.json'].habits).toEqual([]);
  });

  test('should correctly process if user has no coin transactions', async () => {
    const userIdToDelete = 'user123';
    const initialAuthData: UserData = {
      users: [{ id: userIdToDelete, username: 'testUser', isAdmin: false, permissions: [] }],
    };
     const initialWishlistData: WishlistData = {
      items: [
        { id: 'w1', name: 'Item 1', userIds: [userIdToDelete], price: 10, url: '', description: '' },
      ],
    };

    mockFileData('auth', initialAuthData);
    mockFileData('coins', getDefaultCoinsData()); // Empty coins
    mockFileData('wishlist', initialWishlistData);
    mockFileData('habits', getDefaultHabitsData());

    await deleteUser(userIdToDelete);

    expect(savedDataStore['auth.json'].users).toHaveLength(0);
    expect(savedDataStore['coins.json'].balance).toBe(0);
    expect(savedDataStore['coins.json'].transactions).toEqual([]);
    expect(savedDataStore['wishlist.json'].items).toEqual([]); // Item w1 should be deleted
  });

});

// Example of how to check what was written to a file:
// expect(JSON.parse(mockedFs.writeFile.mock.calls[0][1] as string)).toEqual(...);
// Or using the savedDataStore helper:
// expect(savedDataStore['auth.json']).toEqual(...);
