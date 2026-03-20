'use client'

import { useContext } from 'react'
import { ShellContext } from '../layout'
import FolderTree from '@/features/editor/FolderTree'
import { AuthAPI } from '@/lib/auth'

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const { activePanel, selectedNoteId, setSelectedNoteId } = useContext(ShellContext)

  return (
    <>
      {/* ノートパネル */}
      {activePanel === 'notes' && (
        <FolderTree
          onSelectNote={setSelectedNoteId}
          selectedNoteId={selectedNoteId}
        />
      )}

      {/* アカウントパネル */}
      {activePanel === 'account' && (
        <div className="w-64 border-r flex flex-col">
          <div className="px-4 py-3 border-b">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              アカウント
            </span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            <button
              onClick={async () => {
                await AuthAPI.signOut()
                window.location.href = '/'
              }}
              className="w-full py-2 px-3 text-sm border rounded hover:bg-gray-50 text-left text-red-500"
            >
              ログアウト
            </button>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </>
  )
}