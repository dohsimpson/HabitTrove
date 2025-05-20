import { ResponsiveContainer } from 'recharts'
import ClientWrapper from './ClientWrapper'
import Header from './Header'
import Navigation from './Navigation'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <Header className="sticky top-0 z-50" />
      <div className="flex flex-1 overflow-hidden">
        <Navigation viewPort='main' />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 relative">
            {/* responsive container (optimized for mobile) */}
            <div className="mx-auto px-2 xs:px-4 py-8 max-w-sm xs:max-w-full">
              <ClientWrapper>
                {children}
              </ClientWrapper>
            </div>
          </main>
          <Navigation viewPort='mobile' />
        </div>
      </div>
    </div>
  )
}

