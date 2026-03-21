'use client'

import { useNotesContext } from './notes-context'
import Editor from '@/features/editor/Editor'
import { StorageAPI } from '@/core/api/storage'

export default function NotesPage() {
  const { selectedNoteId } = useNotesContext()

  const installPomodoro = async () => {
    await StorageAPI.extensions.install({
      id: 'pomodoro-timer',
      name: 'ポモドーロタイマー',
      version: '1.0.0',
      description: '25分集中・5分休憩のタイマー',
      author: 'ni-devx',
      permissions: ['timer', 'notification'],
      ui: {
        activityBar: { icon: '🍅', label: 'ポモドーロ' },
        sidebarPanel: true,
      },
      entry: 'index.html',
    })
    alert('インストール完了。ページをリロードしてください。')
  }

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