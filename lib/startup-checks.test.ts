import { describe, expect, test, beforeEach, mock } from 'bun:test'
import { checkStartupPermissions } from './startup-checks'

// Mock the fs promises module
const mockStat = mock()
const mockWriteFile = mock()
const mockReadFile = mock()
const mockUnlink = mock()

mock.module('fs', () => ({
  promises: {
    stat: mockStat,
    writeFile: mockWriteFile,
    readFile: mockReadFile,
    unlink: mockUnlink,
  },
}))

describe('checkStartupPermissions', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockStat.mockReset()
    mockWriteFile.mockReset()
    mockReadFile.mockReset()
    mockUnlink.mockReset()
  })

  test('should return success when directory exists and has proper permissions', async () => {
    // Mock successful directory stat
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    })

    // Mock successful file operations
    mockWriteFile.mockResolvedValue(undefined)
    mockReadFile.mockResolvedValue('permission-test')
    mockUnlink.mockResolvedValue(undefined)

    const result = await checkStartupPermissions()

    expect(result).toEqual({ success: true })
    expect(mockStat).toHaveBeenCalledWith('data')
    expect(mockWriteFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'permission-test')
    expect(mockReadFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'utf8')
    expect(mockUnlink).toHaveBeenCalledWith('data/.habittrove-permission-test')
  })

  test('should return error when directory does not exist', async () => {
    mockStat.mockRejectedValue(new Error('ENOENT: no such file or directory'))

    const result = await checkStartupPermissions()

    expect(result).toEqual({
      success: false,
      error: {
        path: 'data',
        message: 'Data directory \'data\' does not exist or is not accessible. Check volume mounts and permissions.',
        type: 'writable_data_dir'
      }
    })
    expect(mockStat).toHaveBeenCalledWith('data')
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  test('should return error when path exists but is not a directory', async () => {
    // Mock path exists but is a file, not directory
    mockStat.mockResolvedValue({
      isDirectory: () => false,
    })

    const result = await checkStartupPermissions()

    expect(result).toEqual({
      success: false,
      error: {
        path: 'data',
        message: 'Path \'data\' exists but is not a directory. Please ensure the data directory is properly configured.',
        type: 'writable_data_dir'
      }
    })
    expect(mockStat).toHaveBeenCalledWith('data')
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  test('should return error when write permission fails', async () => {
    // Mock successful directory stat
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    })

    // Mock write failure
    mockWriteFile.mockRejectedValue(new Error('EACCES: permission denied'))

    const result = await checkStartupPermissions()

    expect(result).toEqual({
      success: false,
      error: {
        path: 'data',
        message: 'Insufficient read/write permissions for data directory \'data\'. Check file permissions and ownership.',
        type: 'writable_data_dir'
      }
    })
    expect(mockStat).toHaveBeenCalledWith('data')
    expect(mockWriteFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'permission-test')
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('should return error when read permission fails', async () => {
    // Mock successful directory stat and write
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    })
    mockWriteFile.mockResolvedValue(undefined)

    // Mock read failure
    mockReadFile.mockRejectedValue(new Error('EACCES: permission denied'))

    const result = await checkStartupPermissions()

    expect(result).toEqual({
      success: false,
      error: {
        path: 'data',
        message: 'Insufficient read/write permissions for data directory \'data\'. Check file permissions and ownership.',
        type: 'writable_data_dir'
      }
    })
    expect(mockStat).toHaveBeenCalledWith('data')
    expect(mockWriteFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'permission-test')
    expect(mockReadFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'utf8')
  })

  test('should return error when read content does not match written content', async () => {
    // Mock successful directory stat and write
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    })
    mockWriteFile.mockResolvedValue(undefined)

    // Mock read with different content
    mockReadFile.mockResolvedValue('different-content')

    const result = await checkStartupPermissions()

    expect(result).toEqual({
      success: false,
      error: {
        path: 'data',
        message: 'Data integrity check failed in \'data\'. File system may be corrupted or have inconsistent behavior.',
        type: 'writable_data_dir'
      }
    })
    expect(mockStat).toHaveBeenCalledWith('data')
    expect(mockWriteFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'permission-test')
    expect(mockReadFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'utf8')
    expect(mockUnlink).not.toHaveBeenCalled()
  })

  test('should return error when cleanup (unlink) fails', async () => {
    // Mock successful directory stat, write, and read
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    })
    mockWriteFile.mockResolvedValue(undefined)
    mockReadFile.mockResolvedValue('permission-test')

    // Mock cleanup failure
    mockUnlink.mockRejectedValue(new Error('EACCES: permission denied'))

    const result = await checkStartupPermissions()

    // Should return error since cleanup failed and is part of the try-catch block
    expect(result).toEqual({
      success: false,
      error: {
        path: 'data',
        message: 'Insufficient read/write permissions for data directory \'data\'. Check file permissions and ownership.',
        type: 'writable_data_dir'
      }
    })
    expect(mockStat).toHaveBeenCalledWith('data')
    expect(mockWriteFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'permission-test')
    expect(mockReadFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'utf8')
    expect(mockUnlink).toHaveBeenCalledWith('data/.habittrove-permission-test')
  })

  test('should use correct file paths', async () => {
    // Mock successful operations
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    })
    mockWriteFile.mockResolvedValue(undefined)
    mockReadFile.mockResolvedValue('permission-test')
    mockUnlink.mockResolvedValue(undefined)

    await checkStartupPermissions()

    // Verify the correct paths are used
    expect(mockStat).toHaveBeenCalledWith('data')
    expect(mockWriteFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'permission-test')
    expect(mockReadFile).toHaveBeenCalledWith('data/.habittrove-permission-test', 'utf8')
    expect(mockUnlink).toHaveBeenCalledWith('data/.habittrove-permission-test')
  })
})