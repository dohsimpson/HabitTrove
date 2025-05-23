import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserForm from './UserForm';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { useHelpers } from '@/lib/client-helpers';
import { deleteUser } from '@/app/actions/data';
import { toast } from '@/hooks/use-toast';
import '@testing-library/jest-dom';

// Mocks
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string, params: any) => {
    if (key === 'toastUserDeletedDescription') return `User ${params.username} deleted.`;
    if (key === 'toastDeleteUserFailed') return `Failed to delete user: ${params.error}`;
    if (key === 'confirmDeleteUser') return `Are you sure you want to delete user ${params.username}?`;
    return key;
  }),
}));

jest.mock('jotai', () => ({
  useAtom: jest.fn(),
  useAtomValue: jest.fn(),
  atom: jest.fn(),
}));

jest.mock('@/lib/client-helpers', () => ({
  useHelpers: jest.fn(),
}));

jest.mock('@/app/actions/data', () => ({
  createUser: jest.fn(),
  updateUser: jest.fn(),
  updateUserPassword: jest.fn(),
  uploadAvatar: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock ConfirmDialog - a simple way for now, might need adjustment based on actual implementation
jest.mock('./ConfirmDialog', () => ({
  __esModule: true,
  default: jest.fn(({ open, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
      <div>
        <button onClick={onConfirm}>Confirm Delete</button>
        <button onClick={onCancel}>Cancel Delete</button>
      </div>
    );
  }),
}));


const mockUsers = [
  { id: 'user1', username: 'TestUser', avatarPath: '', permissions: [], isAdmin: false, password: 'password' },
  { id: 'user2', username: 'AdminUser', avatarPath: '', permissions: [], isAdmin: true, password: 'password' },
  { id: 'user3', username: 'AnotherUser', avatarPath: '', permissions: [], isAdmin: false, password: 'password' },
];

const mockServerSettings = {
  isDemo: false,
  // Add other settings as needed by the component
};

const mockCurrentUser = {
  id: 'user2', // Admin by default for some tests
  username: 'AdminUser',
  isAdmin: true,
  // Add other current user fields as needed
};

describe('UserForm - Delete Account', () => {
  let setUsersDataMock: jest.Mock;
  let onSuccessMock: jest.Mock;
  let onCancelMock: jest.Mock;

  beforeEach(() => {
    setUsersDataMock = jest.fn();
    onSuccessMock = jest.fn();
    onCancelMock = jest.fn();

    (useAtom as jest.Mock).mockReturnValue([
      { users: mockUsers, version: 0 }, // Mocking the structure of usersAtom
      setUsersDataMock
    ]);
    (useAtomValue as jest.Mock).mockImplementation((atom) => {
      if (atom.toString().includes('serverSettingsAtom')) { // A bit hacky way to identify atoms
        return mockServerSettings;
      }
      return {}; // Default mock for other atoms if any
    });
    (useHelpers as jest.Mock).mockReturnValue({
      currentUser: mockCurrentUser,
      deleteUser: deleteUser, // Using the mocked deleteUser from app/actions/data
      // Mock other helpers if UserForm uses them directly
    });
    (deleteUser as jest.Mock).mockResolvedValue({}); // Default successful deletion
    (toast as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockServerSettings.isDemo = false; // Reset demo mode
  });

  // 1. Button Visibility
  it('should render the "Delete Account" button when editing an existing user', () => {
    render(
      <UserForm
        userId="user1"
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );
    expect(screen.getByRole('button', { name: 'deleteAccountButton' })).toBeInTheDocument();
  });

  it('should NOT render the "Delete Account" button when creating a new user', () => {
    render(
      <UserForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );
    expect(screen.queryByRole('button', { name: 'deleteAccountButton' })).not.toBeInTheDocument();
  });

  // 2. Disabled State in Demo Mode
  it('should disable the "Delete Account" button if serverSettings.isDemo is true', () => {
    mockServerSettings.isDemo = true;
    render(
      <UserForm
        userId="user1"
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );
    expect(screen.getByRole('button', { name: 'deleteAccountButton' })).toBeDisabled();
  });

  it('should enable the "Delete Account" button if serverSettings.isDemo is false', () => {
    mockServerSettings.isDemo = false;
    render(
      <UserForm
        userId="user1"
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );
    expect(screen.getByRole('button', { name: 'deleteAccountButton' })).toBeEnabled();
  });

  // 3. Confirmation Dialog
  it('should show a confirmation dialog when "Delete Account" is clicked', () => {
    window.confirm = jest.fn(() => true); // Mock confirm to return true (proceed)
    render(
      <UserForm
        userId="user1"
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );
    const deleteButton = screen.getByRole('button', { name: 'deleteAccountButton' });
    fireEvent.click(deleteButton);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete user TestUser?');
  });

  // 4. Successful Deletion
  it('should call deleteUser, show success toast, and call onSuccess when deletion is confirmed and successful', async () => {
    window.confirm = jest.fn(() => true); // Simulate user confirming
    render(
      <UserForm
        userId="user1" // User to be deleted
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'deleteAccountButton' });
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith('user1');
    });
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'toastUserDeletedTitle',
        description: 'User TestUser deleted.', // Assuming TestUser is user1's username
        variant: 'default',
      });
    });
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(setUsersDataMock).toHaveBeenCalled(); // Check if state is updated
    });
  });

  // 5. Cancelled Deletion
  it('should NOT call deleteUser or onSuccess if deletion is cancelled in the confirmation dialog', async () => {
    window.confirm = jest.fn(() => false); // Simulate user cancelling
    render(
      <UserForm
        userId="user1"
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'deleteAccountButton' });
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'toastUserDeletedTitle' }));
  });

  // 6. Failed Deletion
  it('should show an error toast and not call onSuccess when deletion is confirmed but fails', async () => {
    window.confirm = jest.fn(() => true); // Simulate user confirming
    const errorMessage = 'Network Error';
    (deleteUser as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(
      <UserForm
        userId="user1"
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'deleteAccountButton' });
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith('user1');
    });
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'errorTitle',
        description: `Failed to delete user: ${errorMessage}`,
        variant: 'destructive',
      });
    });
    expect(onSuccessMock).not.toHaveBeenCalled();
  });

  // 7. Self-Deletion Attempt
  it('should prevent self-deletion, show a toast, and not call confirm', async () => {
    window.confirm = jest.fn(() => true); // Mock confirm, though it shouldn't be called
    (useHelpers as jest.Mock).mockReturnValue({
      currentUser: { id: 'user1', username: 'TestUser', isAdmin: false }, // Current user is the one being "edited"
      deleteUser: deleteUser,
    });

    render(
      <UserForm
        userId="user1" // Editing self
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'deleteAccountButton' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'errorTitle',
        description: 'toastCannotDeleteSelf',
        variant: 'destructive',
      });
    });
    expect(window.confirm).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});
