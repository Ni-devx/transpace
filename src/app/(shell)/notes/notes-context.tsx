'use client'

import { createContext, useContext } from 'react'

type NotesContextValue = {
  selectedNoteId?: string
  setSelectedNoteId: (id: string) => void
}

const NotesContext = createContext<NotesContextValue>({
  setSelectedNoteId: () => {},
})

const useNotesContext = () => useContext(NotesContext)

export { NotesContext, useNotesContext }
