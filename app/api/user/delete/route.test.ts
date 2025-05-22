import { POST } from './route'; // Import the POST handler
import { auth } from '@/auth';
import { deleteUser as actualDeleteUser } from '@/app/actions/data';
import { getCurrentUser as actualGetCurrentUser } from '@/lib/server-helpers';
import { User } from '@/lib/types';
import { NextRequest } from 'next/server';

// Mock @/auth
jest.mock('@/auth');
const mockedAuth = auth as jest.MockedFunction<typeof auth>;

// Mock @/app/actions/data
jest.mock('@/app/actions/data', () => ({
  deleteUser: jest.fn(),
}));
const mockedDeleteUser = actualDeleteUser as jest.MockedFunction<typeof actualDeleteUser>;

// Mock @/lib/server-helpers specifically for getCurrentUser
jest.mock('@/lib/server-helpers', () => ({
  getCurrentUser: jest.fn(),
}));
const mockedGetCurrentUser = actualGetCurrentUser as jest.MockedFunction<typeof actualGetCurrentUser>;


describe('API Route: /api/user/delete', () => {
  const mockAdminUser: User = {
    id: 'admin1',
    username: 'admin',
    isAdmin: true,
    permissions: [],
  };
  const mockRegularUser: User = {
    id: 'user1',
    username: 'user',
    isAdmin: false,
    permissions: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to no user session
    mockedAuth.mockResolvedValue(null);
    mockedGetCurrentUser.mockResolvedValue(null);
  });

  const createMockRequest = (body: any, headers?: HeadersInit): NextRequest => {
    return new NextRequest('http://localhost/api/user/delete', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  };

  test('should return 401 Unauthorized if no session', async () => {
    const request = createMockRequest({ userId: 'user1' });
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(401);
    expect(jsonResponse.error).toBe('Unauthorized');
    expect(mockedDeleteUser).not.toHaveBeenCalled();
  });

  test('should return 400 Bad Request if userId is missing', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, expires: 'never' });
    mockedGetCurrentUser.mockResolvedValue(mockRegularUser);
    const request = createMockRequest({}); // Missing userId
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse.error).toBe('Bad Request: userId is required');
    expect(mockedDeleteUser).not.toHaveBeenCalled();
  });
  
  test('should return 400 Bad Request if request body is not valid JSON', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, expires: 'never' });
    mockedGetCurrentUser.mockResolvedValue(mockRegularUser);
    
    const request = new NextRequest('http://localhost/api/user/delete', {
      method: 'POST',
      body: "{userId: 'user1',,}", // Invalid JSON
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse.error).toBe('Invalid request body: Could not parse JSON.');
    expect(mockedDeleteUser).not.toHaveBeenCalled();
  });


  test('should allow a non-admin user to delete their own account', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, expires: 'never' });
    mockedGetCurrentUser.mockResolvedValue(mockRegularUser); // mockRegularUser.id is 'user1'
    mockedDeleteUser.mockResolvedValue(undefined); // Simulate successful deletion

    const request = createMockRequest({ userId: 'user1' });
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(200);
    expect(jsonResponse.message).toBe('User deleted successfully');
    expect(mockedDeleteUser).toHaveBeenCalledWith('user1');
  });

  test('should return 403 Forbidden if a non-admin user tries to delete another user', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, expires: 'never' }); // Logged in as user1
    mockedGetCurrentUser.mockResolvedValue(mockRegularUser);                 // who is not an admin
    
    const request = createMockRequest({ userId: 'user2' }); // Trying to delete user2
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(403);
    expect(jsonResponse.error).toBe('Forbidden: You do not have permission to delete this user.');
    expect(mockedDeleteUser).not.toHaveBeenCalled();
  });

  test('should allow an admin user to delete another user account', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'admin1' }, expires: 'never' }); // Logged in as admin1
    mockedGetCurrentUser.mockResolvedValue(mockAdminUser);                    // who is an admin
    mockedDeleteUser.mockResolvedValue(undefined);

    const request = createMockRequest({ userId: 'user1' }); // Admin deleting user1
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(200);
    expect(jsonResponse.message).toBe('User deleted successfully');
    expect(mockedDeleteUser).toHaveBeenCalledWith('user1');
  });

  test('should allow an admin user to delete their own account', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'admin1' }, expires: 'never' });
    mockedGetCurrentUser.mockResolvedValue(mockAdminUser);
    mockedDeleteUser.mockResolvedValue(undefined);

    const request = createMockRequest({ userId: 'admin1' });
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(200);
    expect(jsonResponse.message).toBe('User deleted successfully');
    expect(mockedDeleteUser).toHaveBeenCalledWith('admin1');
  });

  test('should return 404 Not Found if deleteUser throws "User not found"', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, expires: 'never' });
    mockedGetCurrentUser.mockResolvedValue(mockRegularUser);
    mockedDeleteUser.mockRejectedValue(new Error('User not found'));

    const request = createMockRequest({ userId: 'user1' });
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(404);
    expect(jsonResponse.error).toBe('User not found');
    expect(mockedDeleteUser).toHaveBeenCalledWith('user1');
  });

  test('should return 500 Internal Server Error for other errors during deleteUser', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, expires: 'never' });
    mockedGetCurrentUser.mockResolvedValue(mockRegularUser);
    mockedDeleteUser.mockRejectedValue(new Error('Database connection failed'));

    const request = createMockRequest({ userId: 'user1' });
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(500);
    expect(jsonResponse.error).toBe('Internal Server Error');
    expect(mockedDeleteUser).toHaveBeenCalledWith('user1');
  });
  
  test('should return 401 if session exists but getCurrentUser returns null (edge case)', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, expires: 'never' });
    mockedGetCurrentUser.mockResolvedValue(null); // Simulate user existing in session but not in DB

    const request = createMockRequest({ userId: 'user1' });
    const response = await POST(request);
    const jsonResponse = await response.json();

    expect(response.status).toBe(401);
    expect(jsonResponse.error).toBe('Unauthorized: User not found in system');
    expect(mockedDeleteUser).not.toHaveBeenCalled();
  });
});
