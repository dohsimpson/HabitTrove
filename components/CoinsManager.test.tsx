import { render, fireEvent, screen, act } from '@testing-library/react';
import CoinsManager from './CoinsManager';
import { MAX_COIN_LIMIT } from '@/lib/constants';
import { useCoins } from '@/hooks/useCoins';
import { SettingsProvider, UsersProvider } from '@/lib/atoms';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/i18n/client'; // Adjust path as needed
import { useSearchParams } from 'next/navigation';

// Mock dependencies
jest.mock('@/hooks/useCoins');
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

const mockAdd = jest.fn();
const mockRemove = jest.fn();
const mockUpdateNote = jest.fn();

const mockUseCoins = useCoins as jest.MockedFunction<typeof useCoins>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

const mockUsersData = {
  users: [{ id: 'user1', username: 'TestUser', isAdmin: false, permissions: { coins: 'write' } }],
  status: 'loaded'
};
const mockSettings = { system: { timezone: 'UTC' } };

const renderComponent = () => {
  mockUseCoins.mockReturnValue({
    add: mockAdd,
    remove: mockRemove,
    updateNote: mockUpdateNote,
    balance: 100,
    transactions: [],
    coinsEarnedToday: 0,
    totalEarned: 0,
    totalSpent: 0,
    coinsSpentToday: 0,
    transactionsToday: 0,
  });
  mockUseSearchParams.mockReturnValue(new URLSearchParams());

  return render(
    <I18nextProvider i18n={i18n}>
      <SettingsProvider initialSettings={mockSettings}>
        <UsersProvider initialUsers={mockUsersData}>
          <CoinsManager />
        </UsersProvider>
      </SettingsProvider>
    </I18nextProvider>
  );
};

describe('CoinsManager Coin Limits and Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
     // Setup mock for currentUser from useHelpers inside useCoins, if CoinsManager directly uses it via useHelpers
    // For this test, we assume useCoins correctly resolves the user based on its own logic.
    // If CoinsManager itself calls useHelpers for currentUser, that would need specific mocking too.
  });

  const getCoinInput = () => screen.getByRole('spinbutton') as HTMLInputElement; // Input type number often has spinbutton role
  const getAddButton = () => screen.getByRole('button', { name: /add coins/i });
  const getRemoveButton = () => screen.getByRole('button', { name: /remove coins/i }); // Will appear if amount is negative
  const getIncrementButton = () => screen.getAllByRole('button', { name: '+' })[0]; // Assuming first '+' is for amount
  const getDecrementButton = () => screen.getAllByRole('button', { name: '-' })[0]; // Assuming first '-' is for amount

  test('input field should cap positive value at MAX_COIN_LIMIT', () => {
    renderComponent();
    const coinInput = getCoinInput();
    fireEvent.change(coinInput, { target: { value: (MAX_COIN_LIMIT + 100).toString() } });
    expect(coinInput.value).toBe(MAX_COIN_LIMIT.toString());
  });

  test('input field should cap negative value at -MAX_COIN_LIMIT', () => {
    renderComponent();
    const coinInput = getCoinInput();
    fireEvent.change(coinInput, { target: { value: (-MAX_COIN_LIMIT - 100).toString() } });
    expect(coinInput.value).toBe((-MAX_COIN_LIMIT).toString());
  });

  test('increment button should not allow amount to exceed MAX_COIN_LIMIT', () => {
    renderComponent();
    const coinInput = getCoinInput();
    const incrementButton = getIncrementButton();
    fireEvent.change(coinInput, { target: { value: (MAX_COIN_LIMIT -1).toString() }});
    fireEvent.click(incrementButton); // Now MAX_COIN_LIMIT
    expect(coinInput.value).toBe(MAX_COIN_LIMIT.toString());
    fireEvent.click(incrementButton); // Try to exceed
    expect(coinInput.value).toBe(MAX_COIN_LIMIT.toString());
  });

  test('decrement button should not allow amount to go below -MAX_COIN_LIMIT', () => {
    renderComponent();
    const coinInput = getCoinInput();
    const decrementButton = getDecrementButton();
    fireEvent.change(coinInput, { target: { value: (-MAX_COIN_LIMIT + 1).toString() }});
    fireEvent.click(decrementButton); // Now -MAX_COIN_LIMIT
    expect(coinInput.value).toBe((-MAX_COIN_LIMIT).toString());
    fireEvent.click(decrementButton); // Try to exceed
    expect(coinInput.value).toBe((-MAX_COIN_LIMIT).toString());
  });
  
  test('should correctly handle empty input string', () => {
    renderComponent();
    const coinInput = getCoinInput();
    fireEvent.change(coinInput, { target: { value: '' } });
    expect(coinInput.value).toBe(''); // Or '0' depending on implementation, current is ''
  });

  test('should correctly handle just a minus sign input', () => {
    renderComponent();
    const coinInput = getCoinInput();
    fireEvent.change(coinInput, { target: { value: '-' } });
    expect(coinInput.value).toBe('-');
  });


  test('clicking "Add Coins" calls add from useCoins with positive amount', async () => {
    renderComponent();
    const coinInput = getCoinInput();
    fireEvent.change(coinInput, { target: { value: '50' } });
    const addButton = getAddButton(); // Button text is "Add Coins"
    await act(async () => {
        fireEvent.click(addButton);
    });
    expect(mockAdd).toHaveBeenCalledWith(50, "Manual addition", "");
  });

  test('clicking "Remove Coins" calls remove from useCoins with absolute negative amount', async () => {
    renderComponent();
    const coinInput = getCoinInput();
    fireEvent.change(coinInput, { target: { value: '-75' } });
    // The button text changes to "Remove Coins" when amount is negative
    const removeButton = screen.getByRole('button', { name: /remove coins/i });
     await act(async () => {
        fireEvent.click(removeButton);
    });
    expect(mockRemove).toHaveBeenCalledWith(75, "Manual removal", "");
  });
  
  test('add button should be disabled or not call add if amount is 0 or invalid', async () => {
    renderComponent();
    const coinInput = getCoinInput();
    fireEvent.change(coinInput, { target: { value: '0' } });
    const addButton = getAddButton();
    await act(async () => {
        fireEvent.click(addButton);
    });
    expect(mockAdd).not.toHaveBeenCalled();

    fireEvent.change(coinInput, { target: { value: '' } });
     await act(async () => {
        fireEvent.click(addButton);
    });
    expect(mockAdd).not.toHaveBeenCalled();
    
    fireEvent.change(coinInput, { target: { value: '-' } });
     await act(async () => {
        // Button text might change, ensure we get the correct one
        const currentButton = screen.getByRole('button', { name: /add coins/i }); // or it might be "Remove Coins"
        fireEvent.click(currentButton);
    });
    expect(mockAdd).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

});
