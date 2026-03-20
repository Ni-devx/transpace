'use client'

import { useMemo } from 'react'
import { useResourcesContext } from './resources-context'

export default function ResourcesPage() {
  const { resources, selectedResourceId } = useResourcesContext()
  const resource = useMemo(
    () => resources.find(r => r.id === selectedResourceId),
    [resources, selectedResourceId]
  )

  if (!resource) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        リソースを選択してください
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2 py-1 rounded border text-gray-500">
          {resource.type.toUpperCase()}
        </span>
        <h1 className="text-lg font-bold">{resource.title}</h1>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        作成日: {new Date(resource.created_at).toLocaleString()}
      </div>

      {resource.type === 'url' && (
        <a
          href={resource.detail}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          {resource.detail}
        </a>
      )}

      {resource.type === 'pdf' && (
        <a
          href={resource.detail}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          PDFを開く
        </a>
      )}

      {resource.type === 'image' && (
        <div className="mt-4">
          <img
            src={resource.detail}
            alt={resource.title}
            className="max-w-full rounded border"
          />
        </div>
      )}
    </div>
  )
}
