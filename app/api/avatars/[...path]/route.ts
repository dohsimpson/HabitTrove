import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await Promise.resolve(params)
    const filePath = path.join(process.cwd(), 'data', 'avatars', ...(pathSegments || []))
    const file = await fs.readFile(filePath)
    const ext = path.extname(filePath).slice(1)

    return new NextResponse(file, {
      headers: {
        'Content-Type': `image/${ext}`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  }
}
