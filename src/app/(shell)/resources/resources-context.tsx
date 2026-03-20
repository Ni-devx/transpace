'use client'

import { createContext, useContext } from 'react'
import type { Resource } from '@/core/types/note'

type ResourcesContextValue = {
  resources: Resource[]
  setResources: (resources: Resource[]) => void
  selectedResourceId?: string
  setSelectedResourceId: (id?: string) => void
}

const ResourcesContext = createContext<ResourcesContextValue>({
  resources: [],
  setResources: () => {},
  setSelectedResourceId: () => {},
})

const useResourcesContext = () => useContext(ResourcesContext)

export { ResourcesContext, useResourcesContext }
