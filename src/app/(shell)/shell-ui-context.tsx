'use client'

import { createContext, useContext } from 'react'

type ShellUiContextValue = {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const ShellUiContext = createContext<ShellUiContextValue>({
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  toggleSidebar: () => {},
})

const useShellUiContext = () => useContext(ShellUiContext)

export { ShellUiContext, useShellUiContext }
