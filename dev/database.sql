-- foldersテーブル
create table folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- notesテーブル
create table notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '無題',
  content_markdown text not null default '',
  folder_id uuid references folders(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- updated_atの自動更新
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

-- RLS有効化
alter table folders enable row level security;
alter table notes enable row level security;

-- フォルダのポリシー
create policy "自分のフォルダだけ操作可能" on folders
  for all using (auth.uid() = user_id);

-- ノートのポリシー
create policy "自分のノートだけ操作可能" on notes
  for all using (auth.uid() = user_id);