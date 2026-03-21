'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthAPI } from '@/lib/auth'
import { ShellUiContext } from './shell-ui-context'
import { StorageAPI } from '@/core/api/storage'
import { ExtensionManifest } from '@/core/types/extension'
import { EventAPI } from '@/core/api/event'
import { AI_API } from '@/core/api/ai'

type Panel = 'notes' | 'search' | 'ai' | 'resources' | 'extensions' | 'account' | null

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [extensions, setExtensions] = useState<ExtensionManifest[]>([])
  const [activeExtension, setActiveExtension] = useState<string | null>(null)

  useEffect(() => {
    AuthAPI.getUser().then(user => {
      if (!user) router.push('/')
      else setLoading(false)
    })
  }, [router])

  useEffect(() => {
    StorageAPI.extensions.getEnabled().then(setExtensions)
  }, [])

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const { type, extensionId } = e.data
      if (!type || !extensionId) return
      EventAPI.emit(type, { extensionId })
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

useEffect(() => {
  const handleMessage = async (e: MessageEvent) => {
    const { type, requestId, extensionId } = e.data
    if (!type) return

    // EventAPIへの転送
    if (type.startsWith('event:')) {
      EventAPI.emit(type.replace('event:', ''), { extensionId })
      return
    }

    // SDKリクエストの処理
    if (!requestId) return

    try {
      let data: unknown = null

      if (type === 'storage:getNotes') {
        data = await StorageAPI.notes.getAll(e.data.folderId)
      }
      else if (type === 'storage:getNoteById') {
        data = await StorageAPI.notes.getById(e.data.noteId)
      }
      else if (type === 'ai:ask') {
        const res = await AI_API.ask(e.data.prompt, {
          context: e.data.context
        })
        data = res.content
      }
      else if (type === 'notification:send') {
        // 将来的にNotification APIで実装
        console.log('notification:', e.data.message)
        data = true
      }

      // レスポンスをiframeに返す
      const iframe = document.querySelector(
        `iframe[data-extension-id="${extensionId}"]`
      ) as HTMLIFrameElement

      iframe?.contentWindow?.postMessage({
        requestId,
        data,
      }, '*')

    } catch (err) {
      const iframe = document.querySelector(
        `iframe[data-extension-id="${extensionId}"]`
      ) as HTMLIFrameElement

      iframe?.contentWindow?.postMessage({
        requestId,
        error: String(err),
      }, '*')
    }
  }

  window.addEventListener('message', handleMessage)
  return () => window.removeEventListener('message', handleMessage)
}, [])
  

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      読み込み中...
    </div>
  )

  const activePanel: Panel =
    pathname === '/notes' || pathname.startsWith('/notes/')
      ? 'notes'
      : pathname === '/search' || pathname.startsWith('/search/')
        ? 'search'
        : pathname === '/ai' || pathname.startsWith('/ai/')
          ? 'ai'
          : pathname === '/resources' || pathname.startsWith('/resources/')
            ? 'resources'
            : pathname === '/extensions' || pathname.startsWith('/extensions/')
              ? 'extensions'
              : pathname === '/account' || pathname.startsWith('/account/')
                ? 'account'
                : null

  const handlePanelClick = (panel: Panel, href: string) => {
    if (activePanel === panel) {
      setSidebarCollapsed(prev => !prev)
      return
    }
    setSidebarCollapsed(false)
    router.push(href)
  }

  return (
    <ShellUiContext.Provider value={{
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed(prev => !prev),
    }}>
      <div className="flex h-screen bg-white">

      {/* アクティビティバー */}
      <div className="flex flex-col items-center w-12 bg-gray-100 border-r py-2 gap-1">
        <ActivityButton
          label="ノート"
          active={activePanel === 'notes'}
          onClick={() => handlePanelClick('notes', '/notes')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </ActivityButton>

        <ActivityButton
          label="検索"
          active={activePanel === 'search'}
          onClick={() => handlePanelClick('search', '/search')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a7 7 0 100 14 7 7 0 000-14zm10 16l-4.35-4.35" />
          </svg>
        </ActivityButton>

        <ActivityButton
          label="AI"
          active={activePanel === 'ai'}
          onClick={() => handlePanelClick('ai', '/ai')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2m0 14v2m7-9h2M3 12H1m15.364-6.364l1.414-1.414M6.222 17.778l-1.414 1.414m12.728 0l-1.414-1.414M6.222 6.222L4.808 4.808" />
          </svg>
        </ActivityButton>

        <ActivityButton
  label="拡張機能"
  active={activePanel === 'extensions'}
  onClick={() => handlePanelClick('extensions', '/extensions')}
>
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
</ActivityButton>

        <div className="flex-1" />

            {extensions
      .filter(ext => ext.ui?.activityBar)
      .map(ext => (
        <ActivityButton
          key={ext.id}
          label={ext.ui.activityBar!.label}
          active={activeExtension === ext.id}
          onClick={() => {
            setActiveExtension(prev =>
              prev === ext.id ? null : ext.id
            )
          }}
        >
          <span className="text-lg leading-none">
            {ext.ui.activityBar!.icon}
          </span>
        </ActivityButton>
      ))
    }

        <ActivityButton
          label="アカウント"
          active={activePanel === 'account'}
          onClick={() => handlePanelClick('account', '/account')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </ActivityButton>
      </div>

      {activeExtension && (() => {
  const ext = extensions.find(e => e.id === activeExtension)
  if (!ext?.ui?.sidebarPanel) return null
  return (
    <div className="w-64 border-r flex flex-col">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
          {ext.name}
        </span>
        <button
          onClick={() => setActiveExtension(null)}
          className="text-gray-400 hover:text-black"
        >
          ×
        </button>
      </div>
      <iframe
        src={`/extensions/${ext.id}/${ext.entry}`}
        data-extension-id={ext.id}
        className="flex-1 w-full border-none"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
})()}

      {/* サイドバー（各ページのlayoutが描画する） */}
      {children}

      </div>
    </ShellUiContext.Provider>
  )
}

function ActivityButton({ children, label, active, onClick }: {
  children: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
        active ? 'text-black bg-gray-200' : 'text-gray-400 hover:text-black hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}
