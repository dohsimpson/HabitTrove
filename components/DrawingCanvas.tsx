'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Undo2, Trash2, Palette } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DrawingCanvasProps {
  initialDrawing?: string
  onSave: (drawingData: string) => void
  onClear?: () => void
}

export default function DrawingCanvas({ initialDrawing, onSave, onClear }: DrawingCanvasProps) {
  const t = useTranslations('DrawingModal')
  const [drawingHistory, setDrawingHistory] = useState<Array<{
    color: string
    thickness: number
    points: Array<{ x: number; y: number }>
  }>>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [thickness, setThickness] = useState(4)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.lineCap = 'round'
    context.lineJoin = 'round'
    contextRef.current = context

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  useEffect(() => {
    if (initialDrawing) {
      try {
        const loadedData = JSON.parse(initialDrawing)
        if (Array.isArray(loadedData)) {
          setDrawingHistory(loadedData)
        }
      } catch (e) {
        console.warn('Failed to load initial drawing data')
      }
    }
  }, [initialDrawing])

  useEffect(() => {
    redrawCanvas()
  }, [drawingHistory])

  const getMousePos = (event: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const { x, y } = getMousePos(event)
    setIsDrawing(true)
    contextRef.current?.beginPath()
    contextRef.current?.moveTo(x, y)

    setDrawingHistory(prevHistory => [
      ...prevHistory,
      { color, thickness, points: [{ x, y }] }
    ])
  }

  const draw = (event: React.MouseEvent) => {
    if (!isDrawing || !contextRef.current) return

    event.preventDefault()
    event.stopPropagation()
    const { x, y } = getMousePos(event)
    contextRef.current.lineTo(x, y)
    contextRef.current.strokeStyle = color
    contextRef.current.lineWidth = thickness
    contextRef.current.stroke()

    setDrawingHistory(prevHistory => {
      const lastStroke = prevHistory[prevHistory.length - 1]
      if (lastStroke) {
        lastStroke.points.push({ x, y })
      }
      return [...prevHistory]
    })
  }

  const stopDrawing = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setIsDrawing(false)
    contextRef.current?.closePath()
  }

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !contextRef.current) return

    const context = contextRef.current
    context.clearRect(0, 0, canvas.width, canvas.height)

    drawingHistory.forEach(stroke => {
      if (stroke.points.length === 0) return
      context.beginPath()
      context.strokeStyle = stroke.color
      context.lineWidth = stroke.thickness
      context.moveTo(stroke.points[0].x, stroke.points[0].y)
      stroke.points.forEach(point => {
        context.lineTo(point.x, point.y)
      })
      context.stroke()
    })
  }

  const handleUndo = () => {
    setDrawingHistory(prevHistory => {
      const newHistory = [...prevHistory]
      newHistory.pop()
      return newHistory
    })
  }

  const handleClear = () => {
    setDrawingHistory([])
    onClear?.()
  }

  const handleSave = () => {
    const jsonString = drawingHistory.length > 0 ? JSON.stringify(drawingHistory) : ''
    onSave(jsonString)
  }

  return (
    <div className="flex flex-col space-y-4">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={(e) => stopDrawing(e)}
        onMouseLeave={(e) => stopDrawing(e)}
        className="border border-gray-300 rounded-lg bg-white touch-none w-full h-80 cursor-crosshair"
      />
      
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="colorPicker" className="text-sm font-medium">
            {t('colorLabel')}
          </Label>
          <div className="flex items-center gap-1">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Input
              type="color"
              id="colorPicker"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer p-0"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="lineThickness" className="text-sm font-medium">
            {t('thicknessLabel')}
          </Label>
          <Input
            type="range"
            id="lineThickness"
            min="1"
            max="20"
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground w-6">{thickness}</span>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={drawingHistory.length === 0}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            {t('undoButton')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={drawingHistory.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t('clearButton')}
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          {t('saveDrawingButton')}
        </Button>
      </div>
    </div>
  )
}