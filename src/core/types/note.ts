export type Folder = {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export type Note = {
  id: string
  user_id: string
  title: string
  content_markdown: string
  folder_id: string | null
  created_at: string
  updated_at: string
}

export type CreateNoteInput = {
  title?: string
  content_markdown?: string
  folder_id?: string | null
}

export type CreateFolderInput = {
  name: string
  parent_id?: string | null
}

export type Profile = {
  id: string
  user_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Resource = {
  id: string
  user_id: string
  type: 'url' | 'pdf' | 'image'
  title: string
  detail: string
  created_at: string
}

export type NoteResource = {
  id: string
  note_id: string
  resource_id: string
  created_at: string
}

export type CreateResourceInput = {
  type: 'url' | 'pdf' | 'image'
  title?: string
  detail: string
}