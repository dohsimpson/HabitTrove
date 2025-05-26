import { Logo } from '@/components/Logo'
import Link from 'next/link'
import HeaderActions from './HeaderActions'

interface HeaderProps {
  className?: string
}


export default function Header({ className }: HeaderProps) {
  return (
    <>
      <header className={`border-b bg-white dark:bg-gray-800 shadow-sm ${className || ''}`}>
        <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="mr-3 sm:mr-4">
              <Logo />
            </Link>
            <HeaderActions />
          </div>
        </div>
      </header>
    </>
  )
}

