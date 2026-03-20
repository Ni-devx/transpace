'use client'

import { useState, useEffect } from 'react'
import { StorageAPI } from '@/core/api/storage'
import type { Note } from '@/core/types/note'

type Props = {
  onSelect: (noteId: string) => void
  selectedId?: string
}

export default function NoteList({ onSelect, selectedId }: Props) {
  const [notes, setNotes] = useState<Note[]>([])

  const load = async () => {
    const data = await StorageAPI.notes.getAll()
    setNotes(data)
  }

  useEffect(() => { load() }, [])

  const createNote = async () => {
    const note = await StorageAPI.notes.create({ title: '無題' })
    await load()
    onSelect(note.id)
  }

  return (
    <div className="flex flex-col h-full border-r w-64">
      <div className="p-3 border-b">
        <button
          onClick={createNote}
          className="w-full py-1 px-3 bg-black text-white rounded text-sm"
        >
          ＋ 新規ノート
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notes.map(note => (
          <div
            key={note.id}
            onClick={() => onSelect(note.id)}
            className={`px-4 py-3 cursor-pointer hover:bg-gray-100 border-b ${
              selectedId === note.id ? 'bg-gray-100' : ''
            }`}
          >
            <div className="font-medium text-sm truncate">{note.title}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(note.updated_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}