'use client'

import { useEffect, useRef } from 'react'

interface DrawingDisplayProps {
  drawingData?: string
  width?: number
  height?: number
  className?: string
}

interface DrawingStroke {
  color: string
  thickness: number
  points: Array<{ x: number; y: number }>
}

export default function DrawingDisplay({
  drawingData,
  width = 120,
  height = 80,
  className = ''
}: DrawingDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !drawingData) return

    const context = canvas.getContext('2d')
    if (!context) return

    try {
      const strokes: DrawingStroke[] = JSON.parse(drawingData)

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height)

      // Set up context for drawing
      context.lineCap = 'round'
      context.lineJoin = 'round'

      // Calculate scaling to fit the drawing in the small canvas
      if (strokes.length === 0) return

      // Find bounds of the drawing
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

      strokes.forEach(stroke => {
        stroke.points.forEach(point => {
          minX = Math.min(minX, point.x)
          minY = Math.min(minY, point.y)
          maxX = Math.max(maxX, point.x)
          maxY = Math.max(maxY, point.y)
        })
      })

      // Add padding
      const padding = 10
      const drawingWidth = maxX - minX + padding * 2
      const drawingHeight = maxY - minY + padding * 2

      // Calculate scale to fit in canvas
      const scaleX = canvas.width / drawingWidth
      const scaleY = canvas.height / drawingHeight
      const scale = Math.min(scaleX, scaleY, 1) // Don't scale up

      // Center the drawing
      const offsetX = (canvas.width - drawingWidth * scale) / 2 - (minX - padding) * scale
      const offsetY = (canvas.height - drawingHeight * scale) / 2 - (minY - padding) * scale

      // Draw each stroke
      strokes.forEach(stroke => {
        if (stroke.points.length === 0) return

        context.beginPath()
        context.strokeStyle = stroke.color
        context.lineWidth = Math.max(1, stroke.thickness * scale) // Ensure minimum line width

        const firstPoint = stroke.points[0]
        context.moveTo(
          firstPoint.x * scale + offsetX,
          firstPoint.y * scale + offsetY
        )

        stroke.points.forEach(point => {
          context.lineTo(
            point.x * scale + offsetX,
            point.y * scale + offsetY
          )
        })

        context.stroke()
      })
    } catch (error) {
      console.warn('Failed to render drawing:', error)
    }
  }, [drawingData, width, height])

  if (!drawingData) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`border-2 border-muted-foreground rounded bg-white ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  )
}
