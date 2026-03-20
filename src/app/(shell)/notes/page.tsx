'use client'

import { useContext } from 'react'
import { ShellContext } from '../layout'
import Editor from '@/features/editor/Editor'

export default function NotesPage() {
  const { selectedNoteId } = useContext(ShellContext)

  return (
    <>
      {selectedNoteId
        ? <Editor noteId={selectedNoteId} />
        : <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            ノートを選択してください
          </div>
      }
    </>
  )
}