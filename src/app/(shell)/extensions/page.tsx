'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { StorageAPI } from '@/core/api/storage'
import { ExtensionManifest } from '@/core/types/extension'

export default function ExtensionsPage() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')

  const [extensions, setExtensions] = useState<ExtensionManifest[]>([])
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const exts = category
      ? await StorageAPI.extensions.getByCategory(category)
      : await StorageAPI.extensions.getAll()

    const installed = await StorageAPI.extensions.getEnabled()
    setInstalledIds(new Set(installed.map(e => e.id)))
    setExtensions(exts)
    setLoading(false)
  }

  useEffect(() => { load() }, [category])

  const handleInstall = async (ext: ExtensionManifest) => {
    await StorageAPI.extensions.install(ext)
    await StorageAPI.extensions.incrementInstallCount(ext.id)
    setInstalledIds(prev => new Set([...prev, ext.id]))
  }

  const handleUninstall = async (extensionId: string) => {
  await StorageAPI.extensions.uninstall(extensionId)
  setInstalledIds(prev => {
    const next = new Set(prev)
    next.delete(extensionId)
    return next
  })
  }

  const PERMISSION_LABELS: Record<string, string> = {
    storage: 'ストレージ',
    ai: 'AI',
    timer: 'タイマー',
    notification: '通知',
    event: 'イベント',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
      読み込み中...
    </div>
  )

  return (
    <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
            <h1 className="text-lg font-bold">拡張機能マーケットプレイス</h1>
            <p className="text-xs text-gray-400 mt-1">
            {extensions.length}件の拡張機能
            </p>
        </div>
        <Link
            href="/extensions/submit"
            className="text-xs bg-black text-white px-3 py-2 rounded hover:bg-gray-800"
        >
            ＋ 申請する
        </Link>
        </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-3 max-w-2xl">
          {extensions.map(ext => (
            <div
              key={ext.id}
              className="border rounded-lg p-4 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {ext.ui?.activityBar?.icon ?? '🧩'}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{ext.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      by {ext.author} · v{ext.version}
                    </div>
                    {ext.description && (
                      <div className="text-xs text-gray-600 mt-1">
                        {ext.description}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ext.permissions.map(p => (
                        <span
                          key={p}
                          className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded"
                        >
                          {PERMISSION_LABELS[p] ?? p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                {installedIds.has(ext.id) ? (
                <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-green-600 font-medium">
                    インストール済み
                    </span>
                    <button
                    onClick={() => handleUninstall(ext.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                    >
                    アンインストール
                    </button>
                </div>
                ) : (
                <button
                    onClick={() => handleInstall(ext)}
                    className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800"
                >
                    インストール
                </button>
                )}
                  <span className="text-xs text-gray-400">
                    {ext.install_count ?? 0} インストール
                  </span>
                </div>
              </div>
            </div>
          ))}

          {extensions.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-12">
              拡張機能が見つかりません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}