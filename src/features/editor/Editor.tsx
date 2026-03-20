'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MDEditor from '@uiw/react-md-editor'
import { StorageAPI } from '@/core/api/storage'
import { EventAPI } from '@/core/api/event'
import SelectionToolbar from './SelectionToolbar'
import type { Note } from '@/core/types/note'

type Props = {
  noteId: string
}

export default function Editor({ noteId }: Props) {
  const router = useRouter()
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  // 選択テキスト・ツールバー
  const [selectedText, setSelectedText] = useState('')
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null)

  // トップバーの入力
  const [topBarQuery, setTopBarQuery] = useState('')
  const [topBarMode, setTopBarMode] = useState<'search' | 'ai'>('search')

  // ノート取得
  useEffect(() => {
    StorageAPI.notes.getById(noteId).then(n => {
      setNote(n)
      setContent(n.content_markdown)
      setTitle(n.title)
    })
  }, [noteId])

  // 自動保存
  const save = useCallback(async () => {
    if (!note) return
    setSaving(true)
    await StorageAPI.notes.update(note.id, {
      title,
      content_markdown: content,
    })
    EventAPI.emit('note:saved', { noteId: note.id })
    setSaving(false)
  }, [note, title, content])

  useEffect(() => {
    const timer = setTimeout(save, 1000)
    return () => clearTimeout(timer)
  }, [content, title, save])

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

  // トップバーから開く
  const handleTopBarSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topBarQuery.trim()) return
    const q = encodeURIComponent(topBarQuery.trim())
    router.push(topBarMode === 'search' ? `/search?q=${q}` : `/ai?q=${q}`)
    setToolbarPos(null)
  }

  if (!note) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">読み込み中...</div>

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

        {/* エディタ本体 */}
          <MDEditor
            value={content}
            onChange={v => setContent(v ?? '')}
            height="100%"
            preview="live"
          />
      </div>

      {/* 選択ツールバー */}
      {toolbarPos && (
        <SelectionToolbar
          position={toolbarPos}
          selectedText={selectedText}
          onSearch={text => {
            const q = encodeURIComponent(text)
            router.push(`/search?q=${q}`)
            setToolbarPos(null)
          }}
          onAI={text => {
            const ctx = encodeURIComponent(text)
            router.push(`/ai?context=${ctx}`)
            setToolbarPos(null)
          }}
        />
      )}
    </div>
  )
}
