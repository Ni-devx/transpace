'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CanvasBlock, CanvasBlockType, CanvasDoc } from './canvas/canvas-utils'
import { createBlock } from './canvas/canvas-utils'

type Props = {
  doc: CanvasDoc
  onChange: (next: CanvasDoc | ((prev: CanvasDoc) => CanvasDoc)) => void
}

type SlashMenuState = {
  blockId: string
  query: string
}

const BLOCK_GAP = 24

const SLASH_ITEMS: { type: CanvasBlockType; label: string }[] = [
  { type: 'text', label: 'テキスト' },
  { type: 'heading', label: '見出し' },
  { type: 'code', label: 'コード' },
  { type: 'image', label: '画像' },
  { type: 'drawing', label: '描画（準備中）' },
]

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const MAX_HISTORY = 100

const cloneDoc = (doc: CanvasDoc): CanvasDoc => {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(doc)
  }
  return JSON.parse(JSON.stringify(doc)) as CanvasDoc
}

export default function CanvasEditor({ doc, onChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(doc.blocks[0]?.id ?? null)
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null)
  const [isSpaceDown, setIsSpaceDown] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const blockRefs = useRef<Record<string, HTMLElement | null>>({})
  const undoStackRef = useRef<CanvasDoc[]>([])
  const redoStackRef = useRef<CanvasDoc[]>([])
  const forceSyncRef = useRef(false)

  const zoom = doc.canvas.zoom ?? 1

  const pushHistory = (doc: CanvasDoc) => {
    undoStackRef.current.push(cloneDoc(doc))
    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.shift()
    }
    redoStackRef.current = []
  }

  const updateDoc = (
    updater: (prev: CanvasDoc) => CanvasDoc,
    options?: { recordHistory?: boolean }
  ) => {
    onChange(prev => {
      const next = updater(prev)
      if (next !== prev && options?.recordHistory !== false) {
        pushHistory(prev)
      }
      return next
    })
  }

  const updateBlock = (
    id: string,
    patch: Partial<CanvasBlock>,
    options?: { recordHistory?: boolean }
  ) => {
    updateDoc(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => (b.id === id ? { ...b, ...patch } : b)),
    }), options)
  }

  const addBlock = (block: CanvasBlock) => {
    updateDoc(prev => ({
      ...prev,
      blocks: [...prev.blocks, block],
    }))
  }

  const changeBlockType = (id: string, type: CanvasBlockType) => {
    updateDoc(prev => {
      const current = prev.blocks.find(b => b.id === id)
      if (!current) return prev
      const patch: Partial<CanvasBlock> = {
        type,
        text: type === 'image' ? '' : (current.text ?? ''),
        data: type === 'image' ? { url: '' } : {},
      }
      if (type === 'image') {
        patch.w = 360
        patch.h = 240
      }
      return {
        ...prev,
        blocks: prev.blocks.map(b => (b.id === id ? { ...b, ...patch } : b)),
      }
    })
  }

  const createBlockBelow = (block: CanvasBlock) => {
    const newBlock = createBlock({
      type: 'text',
      x: block.x,
      y: block.y + block.h + BLOCK_GAP,
      w: Math.max(260, block.w),
      h: 120,
      text: '',
    })
    addBlock(newBlock)
    setActiveId(newBlock.id)
  }

  const getBlockById = (id: string | null) => doc.blocks.find(b => b.id === id) ?? null

  useEffect(() => {
    if (!activeId) return
    const el = blockRefs.current[activeId]
    el?.focus()
  }, [activeId])

  useEffect(() => {
    if (!activeId && doc.blocks.length > 0) {
      setActiveId(doc.blocks[0].id)
    }
    if (activeId && !doc.blocks.some(b => b.id === activeId)) {
      setActiveId(doc.blocks[0]?.id ?? null)
    }
  }, [doc.blocks, activeId])

  useEffect(() => {
    const sync = (force: boolean) => {
      doc.blocks.forEach(block => {
        if (block.type === 'text' || block.type === 'heading') {
          const el = blockRefs.current[block.id]
          if (!el) return
          const isFocused = document.activeElement === el
          if (isFocused && !force) return
          const nextText = block.text ?? ''
          if (el.innerText !== nextText) {
            el.innerText = nextText
          }
        }
      })
    }
    sync(forceSyncRef.current)
    forceSyncRef.current = false
  }, [doc.blocks])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          const redo = redoStackRef.current.pop()
          if (redo) {
            undoStackRef.current.push(cloneDoc(doc))
            forceSyncRef.current = true
            onChange(redo)
          }
        } else {
          const undo = undoStackRef.current.pop()
          if (undo) {
            redoStackRef.current.push(cloneDoc(doc))
            forceSyncRef.current = true
            onChange(undo)
          }
        }
        return
      }
      if (e.code !== 'Space') return
      const target = e.target as HTMLElement
      const isTyping = target?.isContentEditable || target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT'
      if (isTyping) return
      setIsSpaceDown(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpaceDown(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [doc, onChange])

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.style.cursor = isSpaceDown ? 'grab' : 'default'
  }, [isSpaceDown])

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSpaceDown || !containerRef.current) return
    const target = e.target as HTMLElement
    if (target.closest('[data-block]')) return
    const startX = e.clientX
    const startY = e.clientY
    const startLeft = containerRef.current.scrollLeft
    const startTop = containerRef.current.scrollTop
    containerRef.current.style.cursor = 'grabbing'

    const handleMove = (move: PointerEvent) => {
      containerRef.current!.scrollLeft = startLeft - (move.clientX - startX)
      containerRef.current!.scrollTop = startTop - (move.clientY - startY)
    }
    const handleUp = () => {
      containerRef.current!.style.cursor = isSpaceDown ? 'grab' : 'default'
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const delta = e.deltaY
    const nextZoom = clamp(zoom * (delta > 0 ? 0.9 : 1.1), 0.5, 2)
    updateDoc(prev => ({
      ...prev,
      canvas: { ...prev.canvas, zoom: nextZoom },
    }), { recordHistory: false })
  }

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left + containerRef.current.scrollLeft) / zoom
    const y = (e.clientY - rect.top + containerRef.current.scrollTop) / zoom
    const newBlock = createBlock({
      type: 'text',
      x: Math.max(0, x - 80),
      y: Math.max(0, y - 20),
      w: 360,
      h: 120,
      text: '',
    })
    addBlock(newBlock)
    setActiveId(newBlock.id)
  }

  const findNextBlock = (current: CanvasBlock, direction: 'up' | 'down') => {
    const candidates = doc.blocks.filter(b => b.id !== current.id)
    const filtered = candidates.filter(b => (direction === 'down' ? b.y > current.y : b.y < current.y))
    if (filtered.length === 0) return null
    const scored = filtered
      .map(b => ({
        block: b,
        score: Math.abs(b.y - current.y) + Math.abs(b.x - current.x) * 0.2,
      }))
      .sort((a, b) => a.score - b.score)
    return scored[0]?.block ?? null
  }

  const renderBlockContent = (block: CanvasBlock) => {
    if (block.type === 'image') {
      const url = block.data?.url ?? ''
      return (
        <div className="flex flex-col h-full">
          {url ? (
            <img src={url} alt={block.text || 'image'} className="max-w-full max-h-full object-contain rounded" />
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
              画像URLを設定してください
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const next = prompt('画像URLを入力してください', url)
                if (next !== null) {
                  updateBlock(block.id, { data: { url: next } })
                }
              }}
              className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
            >
              URL設定
            </button>
            {url && (
              <button
                type="button"
                onClick={() => updateBlock(block.id, { data: { url: '' } })}
                className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
              >
                クリア
              </button>
            )}
          </div>
        </div>
      )
    }

    if (block.type === 'code') {
      return (
        <textarea
          value={block.text ?? ''}
          onChange={e => updateBlock(block.id, { text: e.target.value })}
          className="w-full h-full resize-none bg-transparent outline-none text-sm font-mono"
          spellCheck={false}
        />
      )
    }

    if (block.type === 'drawing') {
      return (
        <div className="flex items-center justify-center h-full text-xs text-gray-400">
          描画ブロックは将来対応予定です
        </div>
      )
    }

    const isHeading = block.type === 'heading'
    return (
      <div
        ref={el => { blockRefs.current[block.id] = el }}
        contentEditable
        suppressContentEditableWarning
        className={`w-full h-full outline-none ${isHeading ? 'text-2xl font-bold' : 'text-sm'}`}
        data-placeholder={isHeading ? '見出し' : 'テキスト'}
        onInput={e => {
          const text = e.currentTarget.textContent ?? ''
          const nextHeight = Math.max(block.h, e.currentTarget.scrollHeight + 8)
          updateBlock(block.id, { text, h: nextHeight })
          if (text.startsWith('/')) {
            setSlashMenu({ blockId: block.id, query: text.slice(1).toLowerCase() })
          } else if (slashMenu?.blockId === block.id) {
            setSlashMenu(null)
          }
        }}
        onKeyDown={e => {
          if ((e.metaKey || e.ctrlKey) && e.altKey) {
            if (e.key === '0') {
              e.preventDefault()
              changeBlockType(block.id, 'text')
            }
            if (e.key === '1') {
              e.preventDefault()
              changeBlockType(block.id, 'heading')
            }
            if (e.key === '2') {
              e.preventDefault()
              changeBlockType(block.id, 'code')
            }
            if (e.key === '3') {
              e.preventDefault()
              changeBlockType(block.id, 'image')
            }
          }
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            createBlockBelow(block)
          }
          if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault()
            const next = findNextBlock(block, e.key === 'ArrowDown' ? 'down' : 'up')
            if (next) setActiveId(next.id)
          }
        }}
        onFocus={() => setActiveId(block.id)}
      />
    )
  }

  const slashItems = useMemo(() => {
    if (!slashMenu) return []
    if (!slashMenu.query) return SLASH_ITEMS
    return SLASH_ITEMS.filter(item =>
      item.label.includes(slashMenu.query) || item.type.includes(slashMenu.query)
    )
  }, [slashMenu])

  const blockList = doc.blocks

  return (
    <div className="flex-1 min-h-0 relative">
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-auto bg-gray-50"
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onDoubleClick={handleDoubleClick}
      >
        <div style={{ width: doc.canvas.width * zoom, height: doc.canvas.height * zoom }}>
          <div
            className="relative"
            style={{
              width: doc.canvas.width,
              height: doc.canvas.height,
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {blockList.map(block => {
              const isActive = block.id === activeId
              return (
                <div
                  key={block.id}
                  data-block
                  className="absolute rounded border border-transparent bg-gray-50 shadow-sm hover:border-gray-300"
                  style={{ left: block.x, top: block.y, width: block.w, height: block.h }}
                  onMouseDown={() => setActiveId(block.id)}
                >
                  {isActive && (
                    <div className="absolute -top-6 left-0 flex items-center gap-2 text-[10px] text-gray-500">
                      <select
                        value={block.type}
                        onChange={e => changeBlockType(block.id, e.target.value as CanvasBlockType)}
                        className="border rounded px-1 py-0.5 bg-white"
                      >
                        <option value="text">テキスト</option>
                        <option value="heading">見出し</option>
                        <option value="code">コード</option>
                        <option value="image">画像</option>
                        <option value="drawing">描画</option>
                      </select>
                      <span className="text-gray-400">⌘/Ctrl+Alt+0〜3</span>
                    </div>
                  )}

                  <div className="absolute -left-3 top-2">
                    <button
                      type="button"
                      title="ドラッグして移動"
                      className="w-5 h-5 rounded-full border bg-white text-[10px] text-gray-400 hover:text-black"
                      onPointerDown={e => {
                        e.preventDefault()
                        pushHistory(doc)
                        const startX = e.clientX
                        const startY = e.clientY
                        const start = { x: block.x, y: block.y }
                        const move = (ev: PointerEvent) => {
                          const dx = (ev.clientX - startX) / zoom
                          const dy = (ev.clientY - startY) / zoom
                          updateBlock(block.id, { x: start.x + dx, y: start.y + dy }, { recordHistory: false })
                        }
                        const up = () => {
                          window.removeEventListener('pointermove', move)
                          window.removeEventListener('pointerup', up)
                        }
                        window.addEventListener('pointermove', move)
                        window.addEventListener('pointerup', up)
                      }}
                    >
                      ⠿
                    </button>
                  </div>

                  <div className="p-3 h-full overflow-hidden">
                    {renderBlockContent(block)}
                  </div>

                  {isActive && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
                      onPointerDown={e => {
                        e.preventDefault()
                        pushHistory(doc)
                        const startX = e.clientX
                        const startY = e.clientY
                        const start = { w: block.w, h: block.h }
                        const move = (ev: PointerEvent) => {
                          const dw = (ev.clientX - startX) / zoom
                          const dh = (ev.clientY - startY) / zoom
                          updateBlock(block.id, {
                            w: Math.max(160, start.w + dw),
                            h: Math.max(80, start.h + dh),
                          }, { recordHistory: false })
                        }
                        const up = () => {
                          window.removeEventListener('pointermove', move)
                          window.removeEventListener('pointerup', up)
                        }
                        window.addEventListener('pointermove', move)
                        window.addEventListener('pointerup', up)
                      }}
                    />
                  )}

                  {slashMenu?.blockId === block.id && slashItems.length > 0 && (
                    <div className="absolute z-50 left-2 top-10 w-44 border rounded bg-white shadow-lg text-xs">
                      {slashItems.map(item => (
                        <button
                          key={item.type}
                          type="button"
                          onMouseDown={e => {
                            e.preventDefault()
                            changeBlockType(block.id, item.type)
                            updateBlock(block.id, { text: '' })
                            setSlashMenu(null)
                          }}
                          className="w-full text-left px-2 py-1 hover:bg-gray-100"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="absolute right-3 bottom-3 flex items-center gap-1 bg-white border rounded px-2 py-1 text-xs shadow">
        <button
          type="button"
          onClick={() =>
            updateDoc(prev => ({
              ...prev,
              canvas: { ...prev.canvas, zoom: clamp(prev.canvas.zoom - 0.1, 0.5, 2) },
            }), { recordHistory: false })
          }
          className="px-2 py-1 hover:bg-gray-100 rounded"
        >
          －
        </button>
        <button
          type="button"
          onClick={() =>
            updateDoc(prev => ({
              ...prev,
              canvas: { ...prev.canvas, zoom: 1 },
            }), { recordHistory: false })
          }
          className="px-2 py-1 hover:bg-gray-100 rounded"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() =>
            updateDoc(prev => ({
              ...prev,
              canvas: { ...prev.canvas, zoom: clamp(prev.canvas.zoom + 0.1, 0.5, 2) },
            }), { recordHistory: false })
          }
          className="px-2 py-1 hover:bg-gray-100 rounded"
        >
          ＋
        </button>
      </div>
    </div>
  )
}
