import { act, renderHook } from '@testing-library/react';
import { useCoins } from './useCoins';
import { MAX_COIN_LIMIT } from '@/lib/constants';
import * as dataActions from '@/app/actions/data';
import { toast } from '@/hooks/use-toast';
import { Provider as JotaiProvider } from 'jotai';
import { settingsAtom, usersAtom, coinsAtom } from '@/lib/atoms'; // Adjust atom imports as needed
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/i18n/client'; // Adjust path

// Mock dependencies
jest.mock('@/app/actions/data', () => ({
  addCoins: jest.fn(),
  removeCoins: jest.fn(),
  saveCoinsData: jest.fn(), // Mock if updateNote is tested, not strictly needed for add/remove
}));
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    if (params) {
      let message = key;
      for (const p in params) {
        message = message.replace(`{${p}}`, params[p]);
      }
      return message;
    }
    return key; // Simple mock, refine if complex translations needed
  },
}));

const mockAddCoins = dataActions.addCoins as jest.Mock;
const mockRemoveCoins = dataActions.removeCoins as jest.Mock;
const mockToast = toast as jest.Mock;

const mockInitialSettings = { system: { timezone: 'UTC' } };
const mockInitialUsers = { 
  users: [{ id: 'user1', username: 'TestUser', isAdmin: true, permissions: { coins: 'write' } }], 
  status: 'loaded' 
};
const mockInitialCoins = {
  balance: 100,
  transactions: [],
};

// Wrapper component to provide necessary contexts
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <JotaiProvider
        initialValues={[
          [settingsAtom, mockInitialSettings],
          [usersAtom, mockInitialUsers],
          [coinsAtom, mockInitialCoins],
        ]}
      >
        {children}
      </JotaiProvider>
    </I18nextProvider>
  );
};


describe('useCoins Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the currentUser to have necessary permissions
    // This is implicitly handled by JotaiProvider and initialUsers state if useCoins uses useHelpers -> currentUser
  });

  describe('add function', () => {
    it('should call addCoins and update state if amount is valid and within MAX_COIN_LIMIT', async () => {
      mockAddCoins.mockResolvedValue({ ...mockInitialCoins, balance: 150 }); // Simulate successful API response
      const { result } = renderHook(() => useCoins(), { wrapper: AllTheProviders });
      
      await act(async () => {
        await result.current.add(50, 'Test add');
      });

      expect(mockAddCoins).toHaveBeenCalledWith({
        amount: 50,
        description: 'Test add',
        type: 'MANUAL_ADJUSTMENT',
        note: undefined, // or "" depending on how it's passed
        userId: 'user1', // Assuming default user or selected user logic works
      });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'useCoins.successTitle' }));
      // Optionally, test state update if Jotai atoms are correctly updated and exposed
    });

    it('should show toast and not call addCoins if amount exceeds MAX_COIN_LIMIT', async () => {
      const { result } = renderHook(() => useCoins(), { wrapper: AllTheProviders });

      await act(async () => {
        await result.current.add(MAX_COIN_LIMIT + 1, 'Test add');
      });

      expect(mockAddCoins).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'useCoins.invalidAmountTitle',
        description: `useCoins.maxAmountExceededDescription.max: ${MAX_COIN_LIMIT}`,
      }));
    });

    it('should show toast and not call addCoins if amount is zero', async () => {
      const { result } = renderHook(() => useCoins(), { wrapper: AllTheProviders });
      await act(async () => {
        await result.current.add(0, 'Test add zero');
      });
      expect(mockAddCoins).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'useCoins.invalidAmountTitle',
        description: 'useCoins.invalidAmountDescription',
      }));
    });
    
    it('should show toast and not call addCoins if amount is negative', async () => {
      const { result } = renderHook(() => useCoins(), { wrapper: AllTheProviders });
      await act(async () => {
        await result.current.add(-10, 'Test add negative');
      });
      expect(mockAddCoins).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'useCoins.invalidAmountTitle',
        description: 'useCoins.invalidAmountDescription',
      }));
    });
  });

  describe('remove function', () => {
    it('should call removeCoins and update state if amount is valid and within MAX_COIN_LIMIT', async () => {
      mockRemoveCoins.mockResolvedValue({ ...mockInitialCoins, balance: 50 }); // Simulate successful API response
      const { result } = renderHook(() => useCoins(), { wrapper: AllTheProviders });
      
      await act(async () => {
        await result.current.remove(50, 'Test remove');
      });

      expect(mockRemoveCoins).toHaveBeenCalledWith({
        amount: 50,
        description: 'Test remove',
        type: 'MANUAL_ADJUSTMENT',
        note: undefined,
        userId: 'user1',
      });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'useCoins.successTitle' }));
    });

    it('should show toast and not call removeCoins if absolute amount exceeds MAX_COIN_LIMIT', async () => {
      const { result } = renderHook(() => useCoins(), { wrapper: AllTheProviders });

      await act(async () => {
        await result.current.remove(MAX_COIN_LIMIT + 1, 'Test remove');
      });

      expect(mockRemoveCoins).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'useCoins.invalidAmountTitle',
        description: `useCoins.maxAmountExceededDescription.max: ${MAX_COIN_LIMIT}`,
      }));
    });
    
    it('should show toast and not call removeCoins if amount is zero', async () => {
      const { result } = renderHook(() => useCoins(), { wrapper: AllTheProviders });
      await act(async () => {
        await result.current.remove(0, 'Test remove zero');
      });
      expect(mockRemoveCoins).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'useCoins.invalidAmountTitle',
        description: 'useCoins.invalidAmountDescription',
      }));
    });

    // remove function takes Math.abs, so negative input is treated as positive for amount check
    // The invalidAmountDescription is for amount <= 0
     it('should treat negative input for remove as positive, show toast if original amount is invalid (e.g. 0 after abs)', async () => {
      const { result } = renderHook(() => useCoins(), { wrapper: AllTheProviders });
      await act(async () => {
        await result.current.remove(-0, 'Test remove negative zero'); // Becomes 0
      });
      expect(mockRemoveCoins).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'useCoins.invalidAmountTitle',
        description: 'useCoins.invalidAmountDescription',
      }));
    });

    it('should call removeCoins with positive amount if negative amount is passed but valid', async () => {
      mockRemoveCoins.mockResolvedValue({ ...mockInitialCoins, balance: 50 });
      const { result } = renderHook(() => useCoins(), { wrapper: AllTheProviders });
      
      await act(async () => {
        await result.current.remove(-50, 'Test remove with negative input');
      });

      expect(mockRemoveCoins).toHaveBeenCalledWith(expect.objectContaining({
        amount: 50, // Should be positive due to Math.abs
      }));
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'useCoins.successTitle' }));
    });
  });
});
