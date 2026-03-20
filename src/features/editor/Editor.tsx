'use client'

import { useState, useEffect, useCallback } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { StorageAPI } from '@/core/api/storage'
import { EventAPI } from '@/core/api/event'
import type { Note } from '@/core/types/note'

type Props = {
  noteId: string
}

export default function Editor({ noteId }: Props) {
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  // ノートの取得
  useEffect(() => {
    StorageAPI.notes.getById(noteId).then(n => {
      setNote(n)
      setContent(n.content_markdown)
      setTitle(n.title)
    })
  }, [noteId])

  // 自動保存（1秒後）
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

  if (!note) return <div>読み込み中...</div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-2 border-b">
        <input
          className="flex-1 text-xl font-bold outline-none"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="タイトル"
        />
        <span className="text-sm text-gray-400">
          {saving ? '保存中...' : '保存済み'}
        </span>
      </div>
      <div className="flex-1">
        <MDEditor
          value={content}
          onChange={v => setContent(v ?? '')}
          height="100%"
          preview="live"
        />
      </div>
    </div>
  )
}