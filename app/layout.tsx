import './globals.css'
import { Inter } from 'next/font/google'
import { DM_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={activeFont.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

