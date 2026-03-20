import { supabase } from '@/lib/supabase'
import type { Note, Folder, CreateNoteInput, CreateFolderInput, Profile, Resource, CreateResourceInput } from '@/core/types/note'
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

    profiles: {
    async get(): Promise<Profile | null> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) return null
      return data
    },

    async update(input: Partial<Pick<Profile, 'user_name' | 'avatar_url'>>): Promise<Profile> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { data, error } = await supabase
        .from('profiles')
        .update(input)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
  },

  // リソース
  resources: {
    async getAll(): Promise<Resource[]> {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    async getByNote(noteId: string): Promise<Resource[]> {
      const { data, error } = await supabase
        .from('note_resources')
        .select('resource_id, resources(*)')
        .eq('note_id', noteId)

      if (error) throw error
      return data.map((d: any) => d.resources)
    },

    async create(input: CreateResourceInput): Promise<Resource> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { data, error } = await supabase
        .from('resources')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },

    async attachToNote(noteId: string, resourceId: string): Promise<void> {
      const { error } = await supabase
        .from('note_resources')
        .insert({ note_id: noteId, resource_id: resourceId })

      if (error) throw error
    },

    async detachFromNote(noteId: string, resourceId: string): Promise<void> {
      const { error } = await supabase
        .from('note_resources')
        .delete()
        .eq('note_id', noteId)
        .eq('resource_id', resourceId)

      if (error) throw error
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id)

      if (error) throw error
    },

    // Supabase Storageへのファイルアップロード（pdf/image）
    async upload(file: File, type: 'pdf' | 'image'): Promise<Resource> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const ext = file.name.split('.').pop()
      const path = `${user.id}/${type}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(path, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(path)

      return this.create({
        type,
        title: file.name,
        detail: publicUrl,
      })
    },
  },
}