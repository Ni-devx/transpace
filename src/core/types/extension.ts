export type ExtensionPermission =
  | 'storage'
  | 'ai'
  | 'timer'
  | 'notification'
  | 'event'

export type ExtensionManifest = {
  id: string
  name: string
  version: string
  description: string
  author: string
  permissions: ExtensionPermission[]
  ui: {
    activityBar?: {
      icon: string
      label: string
    }
    sidebarPanel?: boolean
    bottomPanel?: boolean
  }
  entry: string  // iframeで読み込むHTML
  category?: string
  install_count?: number
}