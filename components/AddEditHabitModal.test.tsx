import { render, fireEvent, screen } from '@testing-library/react';
import AddEditHabitModal from './AddEditHabitModal';
import { MAX_COIN_LIMIT } from '@/lib/constants';
import { SettingsProvider } from '@/lib/atoms'; // Assuming a context provider if needed
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/i18n/client'; // Adjust path as needed

// Mock necessary props and dependencies
const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const defaultProps = {
  onClose: mockOnClose,
  onSave: mockOnSave,
  habit: null,
  isTask: false,
};

// Helper function to render the component with providers
const renderModal = (props = {}) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <SettingsProvider initialSettings={{ system: { timezone: 'UTC' } }}>
        <AddEditHabitModal {...defaultProps} {...props} />
      </SettingsProvider>
    </I18nextProvider>
  );
};

describe('AddEditHabitModal Coin Limits', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockOnClose.mockClear();
    mockOnSave.mockClear();
    // Mock usersAtom if necessary, e.g., if it affects rendering or logic
    // jest.mock('jotai', () => ({
    //   ...jest.requireActual('jotai'),
    //   useAtom: (atom) => {
    //     if (atom.toString().includes('usersAtom')) {
    //       return [{ users: [] }, jest.fn()];
    //     }
    //     return jest.requireActual('jotai').useAtom(atom);
    //   },
    // }));
  });

  test('should initialize with default coin reward', () => {
    renderModal();
    const coinInput = screen.getByLabelText(/reward/i) as HTMLInputElement;
    expect(coinInput.value).toBe('1');
  });

  test('should not allow coin reward to exceed MAX_COIN_LIMIT via input', () => {
    renderModal();
    const coinInput = screen.getByLabelText(/reward/i) as HTMLInputElement;
    fireEvent.change(coinInput, { target: { value: (MAX_COIN_LIMIT + 100).toString() } });
    expect(coinInput.value).toBe(MAX_COIN_LIMIT.toString());
  });

  test('should not allow coin reward to exceed MAX_COIN_LIMIT via increment button', () => {
    renderModal({ habit: { coinReward: MAX_COIN_LIMIT -1 } }); // Start near limit
    const coinInput = screen.getByLabelText(/reward/i) as HTMLInputElement;
    const incrementButton = screen.getByRole('button', { name: '+' });

    fireEvent.click(incrementButton); // current: MAX_COIN_LIMIT
    expect(coinInput.value).toBe(MAX_COIN_LIMIT.toString());

    fireEvent.click(incrementButton); // Try to go beyond
    expect(coinInput.value).toBe(MAX_COIN_LIMIT.toString());
  });
  
  test('increment button should increase coin reward correctly within limit', () => {
    renderModal();
    const coinInput = screen.getByLabelText(/reward/i) as HTMLInputElement;
    const incrementButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(incrementButton);
    expect(coinInput.value).toBe('2');
  });

  test('decrement button should decrease coin reward correctly', () => {
    renderModal({ habit: { coinReward: 5 } });
    const coinInput = screen.getByLabelText(/reward/i) as HTMLInputElement;
    const decrementButton = screen.getByRole('button', { name: '-' });
    fireEvent.click(decrementButton);
    expect(coinInput.value).toBe('4');
  });

  test('decrement button should not allow coin reward to go below 0', () => {
    renderModal({ habit: { coinReward: 0 } });
    const coinInput = screen.getByLabelText(/reward/i) as HTMLInputElement;
    const decrementButton = screen.getByRole('button', { name: '-' });
    fireEvent.click(decrementButton);
    expect(coinInput.value).toBe('0');
  });

  test('should cap manually entered large number to MAX_COIN_LIMIT', () => {
    renderModal();
    const coinInput = screen.getByLabelText(/reward/i) as HTMLInputElement;
    fireEvent.change(coinInput, { target: { value: '15000' } });
    expect(coinInput.value).toBe(MAX_COIN_LIMIT.toString());
  });

  test('should allow entering a value equal to MAX_COIN_LIMIT', () => {
    renderModal();
    const coinInput = screen.getByLabelText(/reward/i) as HTMLInputElement;
    fireEvent.change(coinInput, { target: { value: MAX_COIN_LIMIT.toString() } });
    expect(coinInput.value).toBe(MAX_COIN_LIMIT.toString());
  });

  test('should handle empty input for coin reward gracefully (defaults to 0 or min)', () => {
    renderModal();
    const coinInput = screen.getByLabelText(/reward/i) as HTMLInputElement;
    fireEvent.change(coinInput, { target: { value: '' } });
    // The component behavior might be to set it to '0' or keep it empty then validate on save
    // Based on AddEditHabitModal: `parseInt(e.target.value === "" ? "0" : e.target.value)`
    // So it should become "0"
    expect(coinInput.value).toBe('0'); 
  });

});
