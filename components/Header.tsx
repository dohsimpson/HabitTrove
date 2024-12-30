import { Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

interface HeaderProps {
  className?: string
}

export default function Header({ className }: HeaderProps) {
  return (
    <header className={`border-b bg-white dark:bg-gray-800 shadow-sm ${className || ''}`}>
      <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Logo />
          {/* <div className="flex items-center"> */}
          {/*   <Button variant="ghost" size="icon" className="mr-2"> */}
          {/*     <Bell className="h-5 w-5" /> */}
          {/*   </Button> */}
          {/*   <Button variant="ghost" size="icon"> */}
          {/*     <Settings className="h-5 w-5" /> */}
          {/*   </Button> */}
          {/* </div> */}
        </div>
      </div>
    </header>
  )
}

