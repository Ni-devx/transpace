'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

type Props = {
  width: number
  onWidthChange: (width: number) => void
  minWidth?: number
  maxWidth?: number
  side?: 'left' | 'right'
  className?: string
  children: React.ReactNode
}

export default function ResizablePane({
  width,
  onWidthChange,
  minWidth = 200,
  maxWidth = 520,
  side = 'left',
  className,
  children,
}: Props) {
  const [resizing, setResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  useEffect(() => {
    if (!resizing) return
    const handleMove = (e: PointerEvent) => {
      const delta = e.clientX - startXRef.current
      const next = side === 'left'
        ? startWidthRef.current + delta
        : startWidthRef.current - delta
      const clamped = Math.max(minWidth, Math.min(maxWidth, next))
      onWidthChange(clamped)
    }
    const handleUp = () => setResizing(false)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizing, side, minWidth, maxWidth, onWidthChange])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    startXRef.current = e.clientX
    startWidthRef.current = width
    setResizing(true)
  }

  return (
    <div
      className={`relative flex-shrink-0 h-full ${className ?? ''}`}
      style={{ width }}
    >
      <div className="h-full">
        {children}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        onPointerDown={onPointerDown}
        className={`absolute top-0 ${side === 'left' ? 'right-0' : 'left-0'} h-full w-1.5 cursor-col-resize`}
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}
