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