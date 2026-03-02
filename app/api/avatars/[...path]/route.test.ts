import { afterEach, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import path from 'path'

const mockReadFile = mock()
const mockRealpath = mock()
const mockLstat = mock()

mock.module('fs/promises', () => ({
  default: {
    readFile: mockReadFile,
    realpath: mockRealpath,
    lstat: mockLstat,
  },
  readFile: mockReadFile,
  realpath: mockRealpath,
  lstat: mockLstat,
}))

let GET: typeof import('./route').GET

beforeAll(async () => {
  ;({ GET } = await import('./route'))
})

afterEach(() => {
  mock.restore()
})

describe('GET /api/avatars/[...path]', () => {
  beforeEach(() => {
    mockReadFile.mockReset()
    mockRealpath.mockReset()
    mockLstat.mockReset()

    spyOn(process, 'cwd').mockReturnValue('/app')

    mockRealpath.mockImplementation(async (value: string) => value)
    mockLstat.mockResolvedValue({ isSymbolicLink: () => false })
  })

  test('returns avatar image for valid file path', async () => {
    mockReadFile.mockResolvedValue(Buffer.from('avatar-binary'))

    const response = await GET(new Request('http://localhost:3000/api/avatars/avatar.png'), {
      params: Promise.resolve({ path: ['avatar.png'] }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(mockReadFile).toHaveBeenCalledWith(path.resolve('/app', 'data', 'avatars', 'avatar.png'))
  })

  test('allows nested valid avatar paths', async () => {
    mockReadFile.mockResolvedValue(Buffer.from('avatar-binary'))

    const response = await GET(new Request('http://localhost:3000/api/avatars/user-1/avatar.png'), {
      params: Promise.resolve({ path: ['user-1', 'avatar.png'] }),
    })

    expect(response.status).toBe(200)
    expect(mockReadFile).toHaveBeenCalledWith(path.resolve('/app', 'data', 'avatars', 'user-1', 'avatar.png'))
  })

  test('supports uppercase extensions', async () => {
    mockReadFile.mockResolvedValue(Buffer.from('avatar-binary'))

    const response = await GET(new Request('http://localhost:3000/api/avatars/avatar.PNG'), {
      params: Promise.resolve({ path: ['avatar.PNG'] }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
  })

  test('rejects traversal segments', async () => {
    const response = await GET(new Request('http://localhost:3000/api/avatars/../auth.json'), {
      params: Promise.resolve({ path: ['..', 'auth.json'] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid avatar path' })
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('rejects encoded traversal payloads', async () => {
    const response = await GET(new Request('http://localhost:3000/api/avatars/%2e%2e%2fauth.json'), {
      params: Promise.resolve({ path: ['%2e%2e%2fauth.json'] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid avatar path' })
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('rejects encoded backslash traversal payloads', async () => {
    const response = await GET(new Request('http://localhost:3000/api/avatars/..%5cauth.png'), {
      params: Promise.resolve({ path: ['..%5cauth.png'] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid avatar path' })
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('rejects null byte payloads', async () => {
    const response = await GET(new Request('http://localhost:3000/api/avatars/avatar.png%00'), {
      params: Promise.resolve({ path: ['avatar.png%00'] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid avatar path' })
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('rejects dot-only segments', async () => {
    const response = await GET(new Request('http://localhost:3000/api/avatars/./avatar.png'), {
      params: Promise.resolve({ path: ['.', 'avatar.png'] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid avatar path' })
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('rejects malformed encoded segments', async () => {
    const response = await GET(new Request('http://localhost:3000/api/avatars/%E0%A4%A'), {
      params: Promise.resolve({ path: ['%E0%A4%A'] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid avatar path' })
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('rejects unsupported file extensions', async () => {
    const response = await GET(new Request('http://localhost:3000/api/avatars/config.json'), {
      params: Promise.resolve({ path: ['config.json'] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Unsupported file type' })
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('rejects symlinked avatar files', async () => {
    mockLstat.mockResolvedValue({ isSymbolicLink: () => true })

    const response = await GET(new Request('http://localhost:3000/api/avatars/avatar.png'), {
      params: Promise.resolve({ path: ['avatar.png'] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid avatar path' })
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('rejects files whose real path escapes avatars directory', async () => {
    mockRealpath.mockImplementation(async (value: string) => {
      if (value === path.resolve('/app', 'data', 'avatars')) {
        return value
      }

      return path.resolve('/app', 'data', 'auth.png')
    })

    const response = await GET(new Request('http://localhost:3000/api/avatars/avatar.png'), {
      params: Promise.resolve({ path: ['avatar.png'] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid avatar path' })
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  test('returns 404 when file is missing', async () => {
    mockLstat.mockRejectedValue({ code: 'ENOENT' })

    const response = await GET(new Request('http://localhost:3000/api/avatars/missing.png'), {
      params: Promise.resolve({ path: ['missing.png'] }),
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'File not found' })
  })

  test('returns 500 for non-ENOENT read errors', async () => {
    mockReadFile.mockRejectedValue({ code: 'EACCES' })

    const response = await GET(new Request('http://localhost:3000/api/avatars/avatar.png'), {
      params: Promise.resolve({ path: ['avatar.png'] }),
    })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Internal server error' })
  })
})
