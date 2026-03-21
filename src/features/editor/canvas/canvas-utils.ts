'use client'

export const CANVAS_SIGNATURE = '__tp_canvas_v1__'

export type CanvasBlockType = 'text' | 'heading' | 'image' | 'code' | 'drawing'

export type CanvasBlock = {
  id: string
  type: CanvasBlockType
  x: number
  y: number
  w: number
  h: number
  text?: string
  data?: {
    url?: string
    language?: string
  }
}

export type CanvasDoc = {
  version: 1
  canvas: {
    width: number
    height: number
    zoom: number
    pan: { x: number; y: number }
  }
  blocks: CanvasBlock[]
}

const DEFAULT_CANVAS = {
  width: 5000,
  height: 5000,
  zoom: 1,
  pan: { x: 0, y: 0 },
}

export const createDefaultDoc = (overrides?: Partial<CanvasDoc>): CanvasDoc => ({
  version: 1,
  canvas: {
    width: DEFAULT_CANVAS.width,
    height: DEFAULT_CANVAS.height,
    zoom: DEFAULT_CANVAS.zoom,
    pan: { ...DEFAULT_CANVAS.pan },
  },
  blocks: [],
  ...overrides,
})

const safeParseJson = (json: string): CanvasDoc | null => {
  try {
    const parsed = JSON.parse(json)
    if (!parsed || parsed.version !== 1) return null
    if (!parsed.canvas || !Array.isArray(parsed.blocks)) return null
    return {
      version: 1,
      canvas: {
        width: Math.max(1000, Number(parsed.canvas.width) || DEFAULT_CANVAS.width),
        height: Math.max(1000, Number(parsed.canvas.height) || DEFAULT_CANVAS.height),
        zoom: Number(parsed.canvas.zoom) || 1,
        pan: {
          x: Number(parsed.canvas.pan?.x) || 0,
          y: Number(parsed.canvas.pan?.y) || 0,
        },
      },
      blocks: parsed.blocks as CanvasBlock[],
    }
  } catch {
    return null
  }
}

export const parseCanvasContent = (content: string): CanvasDoc => {
  if (content?.startsWith(CANVAS_SIGNATURE)) {
    const json = content.slice(CANVAS_SIGNATURE.length).trim()
    const doc = safeParseJson(json)
    if (doc) return doc
  }

  const initialText = content?.trim() ? content : ''
  return createDefaultDoc({
    blocks: [
      createBlock({
        type: 'text',
        x: 160,
        y: 120,
        w: 420,
        h: 140,
        text: initialText,
      }),
    ],
  })
}

export const serializeCanvasContent = (doc: CanvasDoc): string => {
  return `${CANVAS_SIGNATURE}\n${JSON.stringify(doc)}`
}

export const canvasToPlainText = (doc: CanvasDoc): string => {
  return doc.blocks
    .map(block => {
      if (block.type === 'image') return `画像: ${block.data?.url ?? ''}`.trim()
      if (block.type === 'drawing') return '描画ブロック'
      const text = block.text ?? ''
      return text.trim()
    })
    .filter(Boolean)
    .join('\n\n')
}

export const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `b_${Math.random().toString(36).slice(2, 10)}`
}

export const createBlock = (input: Partial<CanvasBlock> & { type: CanvasBlockType }): CanvasBlock => ({
  id: input.id ?? generateId(),
  type: input.type,
  x: input.x ?? 120,
  y: input.y ?? 120,
  w: input.w ?? 360,
  h: input.h ?? 120,
  text: input.text ?? '',
  data: input.data ?? {},
})
