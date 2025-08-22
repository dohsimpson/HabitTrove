'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import DrawingCanvas from './DrawingCanvas'
import { useTranslations } from 'next-intl'

interface DrawingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (drawingData: string) => void
  initialDrawing?: string
  title?: string
}

export default function DrawingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialDrawing,
  title = 'Drawing'
}: DrawingModalProps) {
  const t = useTranslations('DrawingModal')
  const [currentDrawing, setCurrentDrawing] = useState<string>(initialDrawing || '')

  const handleSave = (drawingData: string) => {
    setCurrentDrawing(drawingData)
    onSave(drawingData)
    onClose()
  }

  const handleClear = () => {
    setCurrentDrawing('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6" onClick={(e) => e.stopPropagation()}>
          <DrawingCanvas
            initialDrawing={currentDrawing}
            onSave={handleSave}
            onClear={handleClear}
          />
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('cancelButton')}
          </Button>
        </div>
      </div>
    </div>
  )
}