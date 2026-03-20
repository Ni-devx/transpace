'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthAPI } from '@/lib/auth'

type Panel = 'notes' | 'account' | null

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

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
      : pathname === '/account' || pathname.startsWith('/account/')
        ? 'account'
        : null

  return (
    <div className="flex h-screen bg-white">

      {/* アクティビティバー */}
      <div className="flex flex-col items-center w-12 bg-gray-100 border-r py-2 gap-1">
        <ActivityButton
          label="ノート"
          active={activePanel === 'notes'}
          onClick={() => router.push('/notes')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </ActivityButton>

        <div className="flex-1" />

        <ActivityButton
          label="アカウント"
          active={activePanel === 'account'}
          onClick={() => router.push('/account')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </ActivityButton>
      </div>

      {/* サイドバー（各ページのlayoutが描画する） */}
      {children}

    </div>
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
