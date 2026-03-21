'use client'

import { useState } from 'react'
import FolderTree from '@/features/editor/FolderTree'
import { NotesContext } from './notes-context'
import { useShellUiContext } from '../shell-ui-context'
import ResizablePane from '@/features/shell/ResizablePane'

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const [selectedNoteId, setSelectedNoteId] = useState<string>()
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const { sidebarCollapsed } = useShellUiContext()

  return (
    <>
      <NotesContext.Provider value={{ selectedNoteId, setSelectedNoteId }}>
        {!sidebarCollapsed && (
          <ResizablePane
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
            minWidth={220}
            maxWidth={420}
            side="left"
            className="border-r bg-white"
          >
            <FolderTree
              onSelectNote={setSelectedNoteId}
              selectedNoteId={selectedNoteId}
            />
          </ResizablePane>
        )}

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </NotesContext.Provider>
    </>
  )
}
