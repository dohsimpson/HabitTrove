import './globals.css'
import { Inter } from 'next/font/google'
import { DM_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { JotaiProvider } from '@/components/jotai-providers'
import { Suspense } from 'react'
import { JotaiHydrate } from '@/components/jotai-hydrate'
import { loadSettings } from './actions/data'
// Inter (clean, modern, excellent readability)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})
//
// Clean and contemporary
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

const activeFont = dmSans

export const metadata = {
  title: 'HabitTrove',
  description: 'Track your habits and get rewarded',
}

export const dynamic = 'force-dynamic' // needed to prevent nextjs from caching the loadSettings function in Layout component

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialSettings = await loadSettings()
  return (
    <html lang="en">
      <body className={activeFont.className}>
        <JotaiProvider>
          <Suspense fallback="loading">
            <JotaiHydrate initialSettings={initialSettings}>
              {children}
            </JotaiHydrate>
          </Suspense>
        </JotaiProvider>
        <Toaster />
      </body>
    </html>
  )
}

