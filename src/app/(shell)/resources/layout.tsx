'use client'

import { useState } from 'react'
import type { Resource } from '@/core/types/note'
import { ResourcesContext } from './resources-context'
import ResourceSidebar from '@/features/resources/ResourceSidebar'

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>()

  return (
    <ResourcesContext.Provider value={{
      resources,
      setResources,
      selectedResourceId,
      setSelectedResourceId,
    }}>
      <ResourceSidebar />
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </ResourcesContext.Provider>
  )
}
