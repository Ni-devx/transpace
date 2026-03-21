'use client'

import { useState, useEffect } from 'react'
import { StorageAPI } from '@/core/api/storage'
import type { Note, Folder } from '@/core/types/note'

type Props = {
  onSelectNote: (noteId: string) => void
  selectedNoteId?: string
}

type FolderNodeProps = {
  folder: Folder
  depth: number
  onSelectNote: (noteId: string) => void
  selectedNoteId?: string
}

function FolderNode({ folder, depth, onSelectNote, selectedNoteId }: FolderNodeProps) {
  const [open, setOpen] = useState(true)
  const [subFolders, setSubFolders] = useState<Folder[]>([])
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    StorageAPI.folders.getAll(folder.id).then(setSubFolders)
    StorageAPI.notes.getAll(folder.id).then(setNotes)
  }, [folder.id])

  const createNote = async () => {
    const note = await StorageAPI.notes.create({
      title: '無題',
      folder_id: folder.id,
    })
    setNotes(prev => [note, ...prev])
    onSelectNote(note.id)
  }

  const createSubFolder = async () => {
    const name = prompt('フォルダ名')
    if (!name) return
    const f = await StorageAPI.folders.create({
      name,
      parent_id: folder.id,
    })
    setSubFolders(prev => [...prev, f])
  }

  return (
    <div>
      {/* フォルダ行 */}
      <div
        className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 cursor-pointer group"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span onClick={() => setOpen(!open)} className="flex-1 flex items-center gap-1 text-sm">
          <span>{open ? '▾' : '▸'}</span>
          <span>📁</span>
          <span className="truncate">{folder.name}</span>
        </span>
        {/* ホバー時に表示するアクション */}
        <div className="hidden group-hover:flex gap-1">
          <button
            onClick={createNote}
            className="text-xs text-gray-400 hover:text-black px-1"
            title="ノートを追加"
          >＋📄</button>
          <button
            onClick={createSubFolder}
            className="text-xs text-gray-400 hover:text-black px-1"
            title="サブフォルダを追加"
          >＋📁</button>
        </div>
      </div>

      {/* 子要素 */}
      {open && (
        <div>
          {subFolders.map(f => (
            <FolderNode
              key={f.id}
              folder={f}
              depth={depth + 1}
              onSelectNote={onSelectNote}
              selectedNoteId={selectedNoteId}
            />
          ))}
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-100 text-sm truncate ${
                selectedNoteId === note.id ? 'bg-gray-100 font-medium' : ''
              }`}
              style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
            >
              <span>📄</span>
              <span className="truncate">{note.title || '無題'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FolderTree({ onSelectNote, selectedNoteId }: Props) {
  const [rootFolders, setRootFolders] = useState<Folder[]>([])
  const [rootNotes, setRootNotes] = useState<Note[]>([])

  const load = async () => {
    setRootFolders(await StorageAPI.folders.getAll(null))
    setRootNotes(await StorageAPI.notes.getAll(undefined))
  }

  useEffect(() => { load() }, [])

  const createRootFolder = async () => {
    const name = prompt('フォルダ名')
    if (!name) return
    const f = await StorageAPI.folders.create({ name, parent_id: null })
    setRootFolders(prev => [...prev, f])
  }

  const createRootNote = async () => {
    const note = await StorageAPI.notes.create({ title: '無題' })
    setRootNotes(prev => [note, ...prev])
    onSelectNote(note.id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-bold">Transpace</span>
        <div className="flex gap-1">
          <button
            onClick={createRootNote}
            className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
            title="ノートを追加"
          >＋📄</button>
          <button
            onClick={createRootFolder}
            className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
            title="フォルダを追加"
          >＋📁</button>
        </div>
      </div>

      {/* ツリー */}
      <div className="flex-1 overflow-y-auto py-1">
        {rootFolders.map(f => (
          <FolderNode
            key={f.id}
            folder={f}
            depth={0}
            onSelectNote={onSelectNote}
            selectedNoteId={selectedNoteId}
          />
        ))}
        {rootNotes.map(note => (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-gray-100 text-sm ${
              selectedNoteId === note.id ? 'bg-gray-100 font-medium' : ''
            }`}
          >
            <span>📄</span>
            <span className="truncate">{note.title || '無題'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
