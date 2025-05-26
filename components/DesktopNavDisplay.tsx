import Link from 'next/link'
import type { ElementType } from 'react'

export interface NavItemType {
  icon: ElementType;
  label: string;
  href: string;
  position: 'main' | 'bottom';
}

interface DesktopNavDisplayProps {
  navItems: NavItemType[];
  className?: string;
}

export default function DesktopNavDisplay({ navItems, className }: DesktopNavDisplayProps) {
  // Filter for items relevant to desktop view, typically 'main' position
  const desktopNavItems = navItems.filter(item => item.position === 'main');

  return (
    <div className={`hidden lg:flex lg:flex-shrink-0 ${className || ''}`}>
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {desktopNavItems.map((item) => (
                <Link
                  key={item.label} // Assuming labels are unique
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm leading-6 font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <item.icon className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
