'use client'

import { useState } from 'react'
import type { Resource } from '@/core/types/note'
import { ResourcesContext } from './resources-context'
import ResourceSidebar from '@/features/resources/ResourceSidebar'
import { useShellUiContext } from '../shell-ui-context'
import ResizablePane from '@/features/shell/ResizablePane'

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>()
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const { sidebarCollapsed } = useShellUiContext()

  return (
    <ResourcesContext.Provider value={{
      resources,
      setResources,
      selectedResourceId,
      setSelectedResourceId,
    }}>
      {!sidebarCollapsed && (
        <ResizablePane
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          minWidth={220}
          maxWidth={420}
          side="left"
          className="border-r bg-white"
        >
          <ResourceSidebar />
        </ResizablePane>
      )}
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </ResourcesContext.Provider>
  )
}
