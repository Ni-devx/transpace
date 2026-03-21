// 拡張機能がiframe内でimportして使うライブラリ
// 実際はCDN等で配信する想定

type SDKEventName =
  | 'note:saved'
  | 'note:opened'
  | 'note:deleted'
  | 'timer:started'
  | 'timer:completed'
  | 'editor:focused'
  | 'editor:blurred'

type SDKRequest =
  | { type: 'storage:getNotes'; folderId?: string }
  | { type: 'storage:getNoteById'; noteId: string }
  | { type: 'ai:ask'; prompt: string; context?: string }
  | { type: 'notification:send'; message: string }
  | { type: 'timer:start'; duration: number }

type SDKResponse = {
  requestId: string
  data: unknown
  error?: string
}

export const TranspaceSDK = {
  // コアにリクエストを送る
  request<T>(req: SDKRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID()

      const handler = (e: MessageEvent) => {
        const res = e.data as SDKResponse
        if (res.requestId !== requestId) return
        window.removeEventListener('message', handler)
        if (res.error) reject(new Error(res.error))
        else resolve(res.data as T)
      }

      window.addEventListener('message', handler)
      window.parent.postMessage({ ...req, requestId }, '*')

      // タイムアウト
      setTimeout(() => {
        window.removeEventListener('message', handler)
        reject(new Error('Request timeout'))
      }, 5000)
    })
  },

  // イベントを購読する
  on(event: SDKEventName, handler: (payload: unknown) => void): () => void {
    const listener = (e: MessageEvent) => {
      if (e.data.type === `event:${event}`) {
        handler(e.data.payload)
      }
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  },

  // よく使う操作のショートカット
  storage: {
    getNotes: (folderId?: string) =>
      TranspaceSDK.request({ type: 'storage:getNotes', folderId }),
    getNoteById: (noteId: string) =>
      TranspaceSDK.request({ type: 'storage:getNoteById', noteId }),
  },

  ai: {
    ask: (prompt: string, context?: string) =>
      TranspaceSDK.request({ type: 'ai:ask', prompt, context }),
  },

  notification: {
    send: (message: string) =>
      TranspaceSDK.request({ type: 'notification:send', message }),
  },
}