import { supabase } from '@/lib/supabase'
import type { Note, Folder, CreateNoteInput, CreateFolderInput } from '@/core/types/note'

export const StorageAPI = {

  // ノート
  notes: {
    async getAll(folderId?: string | null): Promise<Note[]> {
    const query = supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })

    const { data, error } = (folderId === undefined || folderId === null)
        ? await query.is('folder_id', null)
        : await query.eq('folder_id', folderId)

    if (error) throw error
    return data
    },
    async getById(id: string): Promise<Note> {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },

    async create(input: CreateNoteInput): Promise<Note> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { data, error } = await supabase
        .from('notes')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(id: string, input: Partial<CreateNoteInput>): Promise<Note> {
      const { data, error } = await supabase
        .from('notes')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
  },

  // フォルダ
  folders: {
    async getAll(parentId?: string | null): Promise<Folder[]> {
    const query = supabase
        .from('folders')
        .select('*')
        .order('name')

    const { data, error } = (parentId === undefined || parentId === null)
        ? await query.is('parent_id', null)
        : await query.eq('parent_id', parentId)

    if (error) throw error
    return data
    },

    async create(input: CreateFolderInput): Promise<Folder> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { data, error } = await supabase
        .from('folders')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
  },
}