import Link from 'next/link'
import type { ElementType } from 'react'

export interface NavItemType {
  icon: ElementType;
  label: string;
  href: string;
  position: 'main' | 'bottom';
}

interface MobileNavDisplayProps {
  navItems: NavItemType[];
}

// detect iOS: https://stackoverflow.com/a/9039885
function iOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod',
  ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}


export default function MobileNavDisplay({ navItems }: MobileNavDisplayProps) {
  // Filter for items relevant to mobile view, typically 'main' and 'bottom' positions
  const mobileNavItems = navItems.filter(item => item.position === 'main' || item.position === 'bottom');
  // The original code spread main and bottom items separately, effectively concatenating them.
  // If specific ordering or duplication was intended, that logic would be here.
  // For now, a simple filter and map should suffice if all items are distinct.
  // The original code: [...navItems(isTasksView).filter(item => item.position === 'main'), ...navItems(isTasksView).filter(item => item.position === 'bottom')]
  // This implies that items could be in 'main' or 'bottom'. The current navItems only have 'main'.
  // A simple combined list is fine.
  const isIOS = iOS()

  return (
    <>
      <div className={isIOS ? "pb-20" : "pb-16"} /> {/* Add padding at the bottom to prevent content from being hidden */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg ${isIOS ? "pb-4" : ""}`}>
        <div className="grid grid-cols-5 w-full">
          {mobileNavItems.map((item) => (
            <Link
              key={item.label} // Assuming labels are unique
              href={item.href}
              className="flex flex-col items-center justify-center py-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[0.625rem] mt-1 text-center leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
