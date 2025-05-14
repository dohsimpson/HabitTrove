import { JotaiHydrate } from '@/components/jotai-hydrate'
import { JotaiProvider } from '@/components/jotai-providers'
import Layout from '@/components/Layout'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from 'next-auth/react'
import { DM_Sans } from 'next/font/google'
import { Suspense } from 'react'
import { loadCoinsData, loadHabitsData, loadServerSettings, loadSettings, loadUsersData, loadWishlistData } from './actions/data'
import './globals.css'


// Inter (clean, modern, excellent readability)
// const inter = Inter({
//   subsets: ['latin'],
//   weight: ['400', '500', '600', '700']
// })

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

export const dynamic = 'force-dynamic' // needed to prevent nextjs from caching the load... functions in Layout component

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [initialSettings, initialHabits, initialCoins, initialWishlist, initialUsers, initialServerSettings] = await Promise.all([
    loadSettings(),
    loadHabitsData(),
    loadCoinsData(),
    loadWishlistData(),
    loadUsersData(),
    loadServerSettings(),
  ])

  return (
    // set suppressHydrationWarning to true to prevent hydration errors when using ThemeProvider (https://ui.shadcn.com/docs/dark-mode/next)
    <html lang="en" suppressHydrationWarning>
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
                wishlist: initialWishlist,
                users: initialUsers,
                serverSettings: initialServerSettings,
              }}
            >
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <SessionProvider>
                  <Layout>
                    {children}
                  </Layout>
                </SessionProvider>
              </ThemeProvider>
            </JotaiHydrate>
          </Suspense>
        </JotaiProvider>
        <Toaster />
      </body>
    </html>
  )
}

