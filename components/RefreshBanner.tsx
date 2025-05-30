'use client'

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface RefreshBannerProps {
  onRefresh: () => void;
}

export default function RefreshBanner({ onRefresh }: RefreshBannerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-yellow-400 dark:bg-yellow-500 text-black dark:text-gray-900 p-4 rounded-lg shadow-lg flex items-center gap-3">
      <AlertTriangle className="h-6 w-6 text-yellow-800 dark:text-yellow-900" />
      <div>
        <p className="font-semibold">Data out of sync</p>
        <p className="text-sm">New data is available. Please refresh to see the latest updates.</p>
      </div>
      <Button
        onClick={onRefresh}
        variant="outline"
        className="ml-auto bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 border-yellow-600 dark:border-yellow-700 text-white dark:text-gray-900"
      >
        Refresh
      </Button>
    </div>
  )
}
