'use client'

import { useEffect, useRef, useState } from 'react'
import { StorageAPI } from '@/core/api/storage'
import type { Resource } from '@/core/types/note'
import { useResourcesContext } from '@/app/(shell)/resources/resources-context'

export default function ResourceSidebar() {
  const { resources, setResources, selectedResourceId, setSelectedResourceId } = useResourcesContext()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState<'pdf' | 'image'>('pdf')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await StorageAPI.resources.getAll()
      setResources(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const createUrl = async () => {
    const url = prompt('URLを入力してください')
    if (!url) return
    const title = prompt('タイトル（任意）') ?? ''
    const res = await StorageAPI.resources.create({
      type: 'url',
      title: title.trim() || url,
      detail: url,
    })
    setResources(prev => [res, ...prev])
    setSelectedResourceId(res.id)
  }

  const triggerUpload = (type: 'pdf' | 'image') => {
    setUploadType(type)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await StorageAPI.resources.upload(file, uploadType)
      setResources(prev => [res, ...prev])
      setSelectedResourceId(res.id)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const formatType = (r: Resource) => {
    if (r.type === 'url') return 'URL'
    if (r.type === 'pdf') return 'PDF'
    return '画像'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-bold">リソース</span>
        <div className="flex gap-1">
          <button
            onClick={createUrl}
            className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
            title="URLを追加"
          >
            ＋🔗
          </button>
          <button
            onClick={() => triggerUpload('pdf')}
            className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
            title="PDFを追加"
            disabled={uploading}
          >
            ＋📄
          </button>
          <button
            onClick={() => triggerUpload('image')}
            className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
            title="画像を追加"
            disabled={uploading}
          >
            ＋🖼
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={uploadType === 'pdf' ? 'application/pdf' : 'image/*'}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex-1 overflow-y-auto py-1">
        {loading && (
          <div className="px-3 py-2 text-xs text-gray-400">読み込み中...</div>
        )}
        {!loading && resources.length === 0 && (
          <div className="px-3 py-2 text-xs text-gray-400">
            まだリソースがありません
          </div>
        )}
        {resources.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedResourceId(r.id)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
              selectedResourceId === r.id ? 'bg-gray-100 font-medium' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{formatType(r)}</span>
              <span className="truncate">{r.title || r.detail}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
