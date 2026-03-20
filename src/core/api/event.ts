type EventPayload = {
  'note:saved': { noteId: string }
  'note:opened': { noteId: string }
  'note:deleted': { noteId: string }
  'folder:created': { folderId: string }
  'folder:deleted': { folderId: string }
  'editor:focused': {}
  'editor:blurred': {}
}

type EventName = keyof EventPayload
type Handler<T extends EventName> = (payload: EventPayload[T]) => void

// ここを変える
const listeners = new Map<EventName, Set<Handler<any>>>()

export const EventAPI = {

  on<T extends EventName>(event: T, handler: Handler<T>): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(handler)

    return () => {
      listeners.get(event)?.delete(handler)
    }
  },

  emit<T extends EventName>(event: T, payload: EventPayload[T]): void {
    listeners.get(event)?.forEach(handler => handler(payload))
  },

  off<T extends EventName>(event: T, handler: Handler<T>): void {
    listeners.get(event)?.delete(handler)
  },
}