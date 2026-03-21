'use client'

import { useState, useEffect, useCallback } from 'react'
import { StorageAPI } from '@/core/api/storage'
import { EventAPI } from '@/core/api/event'
import SelectionToolbar from './SelectionToolbar'
import RightPanel from './RightPanel'
import CanvasEditor from './CanvasEditor'
import type { Note } from '@/core/types/note'
import { canvasToPlainText, parseCanvasContent, serializeCanvasContent, type CanvasDoc } from './canvas/canvas-utils'

type Props = {
  noteId: string
}

type PanelState = {
  mode: 'search' | 'ai'
  scope?: 'selection' | 'note'
  initialQuery: string
  initialPrompt?: string
  hasContext: boolean
  contextText?: string
} | null

export default function Editor({ noteId }: Props) {
  const [note, setNote] = useState<Note | null>(null)
  const [doc, setDoc] = useState<CanvasDoc | null>(null)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  // 選択テキスト・ツールバー
  const [selectedText, setSelectedText] = useState('')
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null)

  // 右パネル（選択/ノートAI・検索）
  const [panel, setPanel] = useState<PanelState>(null)

  // トップバーの入力
  const [topBarQuery, setTopBarQuery] = useState('')
  const [topBarMode, setTopBarMode] = useState<'search' | 'ai'>('search')

  const handleDocChange = (next: CanvasDoc | ((prev: CanvasDoc) => CanvasDoc)) => {
    setDoc(prev => {
      if (!prev) return prev
      return typeof next === 'function' ? next(prev) : next
    })
  }

  // ノート取得
  useEffect(() => {
    StorageAPI.notes.getById(noteId).then(n => {
      setNote(n)
      setDoc(parseCanvasContent(n.content_markdown || ''))
      setTitle(n.title)
    })
  }, [noteId])

  // 自動保存
  const save = useCallback(async () => {
    if (!note || !doc) return
    setSaving(true)
    await StorageAPI.notes.update(note.id, {
      title,
      content_markdown: serializeCanvasContent(doc),
    })
    EventAPI.emit('note:saved', { noteId: note.id })
    setSaving(false)
  }, [note, title, doc])

  useEffect(() => {
    const timer = setTimeout(save, 1000)
    return () => clearTimeout(timer)
  }, [doc, title, save])

useEffect(() => {
  const handleMouseUp = (e: MouseEvent) => {
    setTimeout(() => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (text && text.length > 0) {
        const range = selection!.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setSelectedText(text)
        setToolbarPos({
          x: rect.left + rect.width / 2 - 60,
          y: rect.top + window.scrollY,
        })
      }
      // ツールバーのボタンクリック時はクリアしない
      const target = e.target as HTMLElement
      if (!target.closest('[data-selection-toolbar]')) {
        if (!text || text.length === 0) {
          setToolbarPos(null)
          setSelectedText('')
        }
      }
    }, 30)
  }

  document.addEventListener('mouseup', handleMouseUp)
  return () => document.removeEventListener('mouseup', handleMouseUp)
}, [])

  const openSearchPanel = (query: string) => {
    setPanel({
      mode: 'search',
      initialQuery: query,
      hasContext: false,
    })
  }

  const openSelectionAiPanel = (text: string, prompt?: string) => {
    setPanel({
      mode: 'ai',
      scope: 'selection',
      initialQuery: text,
      initialPrompt: prompt,
      hasContext: true,
      contextText: text,
    })
  }

  const openNoteAiPanel = (prompt: string) => {
    const noteContext = `タイトル: ${title || '無題'}\n\n本文:\n${doc ? canvasToPlainText(doc) : ''}`
    setPanel({
      mode: 'ai',
      scope: 'note',
      initialQuery: prompt,
      initialPrompt: prompt,
      hasContext: true,
      contextText: noteContext,
    })
  }

  // トップバーから開く
  const handleTopBarSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topBarQuery.trim()) return
    if (topBarMode === 'search') {
      openSearchPanel(topBarQuery.trim())
    } else {
      openNoteAiPanel(topBarQuery.trim())
    }
    setToolbarPos(null)
  }

  if (!note || !doc) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">読み込み中...</div>

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* トップバー */}
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-white">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-bold outline-none flex-1 min-w-0"
            placeholder="タイトル"
          />
          <span className="text-xs text-gray-300 shrink-0">
            {saving ? '保存中...' : '保存済み'}
          </span>
        </div>

        {/* 検索・AIバー */}
        <form
          onSubmit={handleTopBarSubmit}
          className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50"
        >
          <div className="flex rounded border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setTopBarMode('search')}
              className={`px-3 py-1.5 ${topBarMode === 'search' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              🔍 検索
            </button>
            <button
              type="button"
              onClick={() => setTopBarMode('ai')}
              className={`px-3 py-1.5 ${topBarMode === 'ai' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              ✦ AI
            </button>
          </div>
          <input
            value={topBarQuery}
            onChange={e => setTopBarQuery(e.target.value)}
            placeholder={topBarMode === 'search' ? '検索ワードを入力...' : 'AIに質問...'}
            className="flex-1 text-sm border rounded px-3 py-1.5 outline-none focus:border-black"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800"
          >
            実行
          </button>
        </form>
        {topBarMode === 'ai' && (
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-white text-xs">
            <span className="text-gray-400">テンプレ:</span>
            <button
              type="button"
              onClick={() => {
                const prompt = 'このノートを要約して'
                setTopBarQuery(prompt)
                openNoteAiPanel(prompt)
              }}
              className="px-2 py-1 border rounded hover:bg-gray-50"
            >
              要約
            </button>
            <button
              type="button"
              onClick={() => {
                const prompt = 'このノートをもとに理解度チェック問題を3問作って'
                setTopBarQuery(prompt)
                openNoteAiPanel(prompt)
              }}
              className="px-2 py-1 border rounded hover:bg-gray-50"
            >
              問題作成
            </button>
            <button
              type="button"
              onClick={() => {
                const prompt = 'このノートの重要ポイントを箇条書きで整理して'
                setTopBarQuery(prompt)
                openNoteAiPanel(prompt)
              }}
              className="px-2 py-1 border rounded hover:bg-gray-50"
            >
              重要ポイント
            </button>
          </div>
        )}

        {/* エディタ本体 */}
        <CanvasEditor doc={doc} onChange={handleDocChange} />
      </div>

      {/* 選択ツールバー */}
      {toolbarPos && (
        <SelectionToolbar
          position={toolbarPos}
          selectedText={selectedText}
          onSearch={text => {
            openSearchPanel(text)
            setToolbarPos(null)
          }}
          onAI={text => {
            openSelectionAiPanel(text)
            setToolbarPos(null)
          }}
          onQuickAsk={text => {
            openSelectionAiPanel(text, 'これは何？')
            setToolbarPos(null)
          }}
        />
      )}

      {/* 右パネル */}
      {panel && (
        <RightPanel
          mode={panel.mode}
          scope={panel.scope}
          initialQuery={panel.initialQuery}
          initialPrompt={panel.initialPrompt}
          hasContext={panel.hasContext}
          contextText={panel.contextText}
          contextLabel={panel.scope === 'note' ? 'このノートの内容を参照しています' : undefined}
          layout="sidebar"
          showClose
          onClose={() => setPanel(null)}
          systemPrompt={
            panel.scope === 'selection'
              ? 'あなたは選択された語彙・文章の意味や背景を簡潔に説明する学習支援AIです。必要なら例も示してください。'
              : panel.scope === 'note'
                ? 'あなたはこのノートの内容に基づいて質問に答える学習支援AIです。ノート外の推測は控え、必要なら確認質問をしてください。'
                : undefined
          }
        />
      )}
    </div>
  )
}
