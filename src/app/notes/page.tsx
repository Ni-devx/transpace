'use client'

import { useState } from 'react'
import NoteList from '@/features/editor/NoteList'
import Editor from '@/features/editor/Editor'

export default function NotesPage() {
  const [selectedId, setSelectedId] = useState<string>()

  return (
    <div className="flex h-screen">
      <NoteList
        onSelect={setSelectedId}
        selectedId={selectedId}
      />
      <div className="flex-1">
        {selectedId
          ? <Editor noteId={selectedId} />
          : <div className="flex items-center justify-center h-full text-gray-400">
              ノートを選択してください
            </div>
        }
      </div>
    </div>
  )
}