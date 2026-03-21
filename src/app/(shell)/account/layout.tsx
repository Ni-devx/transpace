'use client'

import { useState } from 'react'
import { AuthAPI } from '@/lib/auth'
import { useShellUiContext } from '../shell-ui-context'
import ResizablePane from '@/features/shell/ResizablePane'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
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
                アカウント
              </span>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <button
                onClick={async () => {
                  await AuthAPI.signOut()
                  window.location.href = '/'
                }}
                className="w-full py-2 px-3 text-sm border rounded hover:bg-gray-50 text-left text-red-500"
              >
                ログアウト
              </button>
            </div>
          </div>
        </ResizablePane>
      )}

      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </>
  )
}
