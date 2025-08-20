'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function RecheckButton() {
  const handleRecheck = () => {
    window.location.reload()
  }

  return (
    <Button 
      onClick={handleRecheck}
      variant="outline" 
      size="sm"
      className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Recheck
    </Button>
  )
}