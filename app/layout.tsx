import './globals.css'
import { Inter } from 'next/font/google'
import { DM_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { JotaiProvider } from '@/components/jotai-providers'
import { Suspense } from 'react'
import { JotaiHydrate } from '@/components/jotai-hydrate'
import { loadSettings, loadHabitsData, loadCoinsData, loadWishlistData } from './actions/data'
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
  const [initialSettings, initialHabits, initialCoins, initialWishlist] = await Promise.all([
    loadSettings(),
    loadHabitsData(),
    loadCoinsData(),
    loadWishlistData()
  ])

  return (
    <html lang="en">
      <body className={activeFont.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                      console.log('ServiceWorker registration successful');
                    })
                    .catch(err => {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }
            `,
          }}
        />
        <JotaiProvider>
          <Suspense fallback="loading">
            <JotaiHydrate
              initialValues={{
                settings: initialSettings,
                habits: initialHabits,
                coins: initialCoins,
                wishlist: initialWishlist
              }}
            >
              {children}
            </JotaiHydrate>
          </Suspense>
        </JotaiProvider>
        <Toaster />
      </body>
    </html>
  )
}

