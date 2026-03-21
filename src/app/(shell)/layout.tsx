'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthAPI } from '@/lib/auth'
import { ShellUiContext } from './shell-ui-context'

type Panel = 'notes' | 'search' | 'ai' | 'resources' | 'account' | null

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    AuthAPI.getUser().then(user => {
      if (!user) router.push('/')
      else setLoading(false)
    })
  }, [router])

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

        <div className="flex-1" />

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
