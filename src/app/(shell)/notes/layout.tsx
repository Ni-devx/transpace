'use client'

import { useState } from 'react'
import FolderTree from '@/features/editor/FolderTree'
import { NotesContext } from './notes-context'

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const [selectedNoteId, setSelectedNoteId] = useState<string>()

  return (
    <>
      <NotesContext.Provider value={{ selectedNoteId, setSelectedNoteId }}>
        <FolderTree
          onSelectNote={setSelectedNoteId}
          selectedNoteId={selectedNoteId}
        />

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </NotesContext.Provider>
    </>
  )
}
