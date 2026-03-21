'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useShellUiContext } from '../shell-ui-context'
import ResizablePane from '@/features/shell/ResizablePane'

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useShellUiContext()
  const [sidebarWidth, setSidebarWidth] = useState(260)

  return (
    <>
      {!sidebarCollapsed && (
        <ResizablePane
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          minWidth={220}
          maxWidth={420}
          side="left"
          className="border-r bg-white"
        >
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b">
              <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                検索
              </span>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <Link
                href="/search"
                className="w-full py-2 px-3 text-sm border rounded hover:bg-gray-50 text-left"
              >
                新しい検索
              </Link>
              <p className="text-xs text-gray-400">
                セキュリティ上の理由でブラウザ内埋め込みはできません。
              </p>
            </div>
          </div>
        </ResizablePane>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </>
  )
}
