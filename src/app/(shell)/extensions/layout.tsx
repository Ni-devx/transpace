'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useContext } from 'react'
import { ShellUiContext } from '../shell-ui-context'

const CATEGORIES = [
  { id: 'all', label: 'すべて' },
  { id: 'productivity', label: '生産性' },
  { id: 'ai', label: 'AI' },
  { id: 'review', label: '復習' },
  { id: 'other', label: 'その他' },
]

export default function ExtensionsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarCollapsed } = useContext(ShellUiContext)

  if (sidebarCollapsed) return <>{children}</>

  return (
    <>
      <div className="w-64 border-r flex flex-col">
        <div className="px-4 py-3 border-b">
          <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            拡張機能
          </span>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              onClick={() => router.push(
                cat.id === 'all'
                  ? '/extensions'
                  : `/extensions?category=${cat.id}`
              )}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                (cat.id === 'all' && pathname === '/extensions') ||
                pathname.includes(`category=${cat.id}`)
                  ? 'font-medium text-black'
                  : 'text-gray-600'
              }`}
            >
              {cat.label}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </>
  )
}