import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development' && request.nextUrl.pathname.startsWith('/debug')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/debug/:path*'],
}
