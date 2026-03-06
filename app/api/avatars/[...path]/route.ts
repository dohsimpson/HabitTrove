import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { ALLOWED_AVATAR_EXTENSIONS, AVATAR_CONTENT_TYPE } from '@/lib/avatar'

function sanitizePathSegments(pathSegments?: string[]): string[] | null {
  if (!pathSegments || pathSegments.length === 0) {
    return null
  }

  const safeSegments: string[] = []

  for (const rawSegment of pathSegments) {
    let segment = rawSegment

    try {
      segment = decodeURIComponent(rawSegment)
    } catch {
      return null
    }

    if (!segment || segment === '.' || segment === '..') {
      return null
    }

    if (segment.includes('/') || segment.includes('\\') || segment.includes('\0')) {
      return null
    }

    safeSegments.push(segment)
  }

  return safeSegments
}

function isPathInsideBase(basePath: string, targetPath: string): boolean {
  return targetPath === basePath || targetPath.startsWith(`${basePath}${path.sep}`)
}

function getErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null
  }

  const { code } = error as { code?: unknown }
  return typeof code === 'string' ? code : null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await Promise.resolve(params)
  const safeSegments = sanitizePathSegments(pathSegments)

  if (!safeSegments) {
    return NextResponse.json({ error: 'Invalid avatar path' }, { status: 400 })
  }

  const avatarsDir = path.resolve(process.cwd(), 'data', 'avatars')
  const filePath = path.resolve(avatarsDir, ...safeSegments)

  if (!isPathInsideBase(avatarsDir, filePath)) {
    return NextResponse.json({ error: 'Invalid avatar path' }, { status: 400 })
  }

  const ext = path.extname(filePath).toLowerCase()

  if (!ALLOWED_AVATAR_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  try {
    const realAvatarsDir = await fs.realpath(avatarsDir)
    const fileStats = await fs.lstat(filePath)

    if (fileStats.isSymbolicLink()) {
      return NextResponse.json({ error: 'Invalid avatar path' }, { status: 400 })
    }

    const realFilePath = await fs.realpath(filePath)

    if (!isPathInsideBase(realAvatarsDir, realFilePath)) {
      return NextResponse.json({ error: 'Invalid avatar path' }, { status: 400 })
    }

    const file = await fs.readFile(realFilePath)

    return new NextResponse(file, {
      headers: {
        'Content-Type': AVATAR_CONTENT_TYPE[ext] ?? 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (getErrorCode(error) === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    console.error('Error reading avatar file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
