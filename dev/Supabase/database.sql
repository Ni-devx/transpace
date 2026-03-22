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


  -- profilesテーブル
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- resourcesテーブル
create table resources (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('url', 'pdf', 'image')),
  title text not null default '無題',
  detail text not null,
  created_at timestamptz default now() not null
);

-- note_resourcesテーブル（中間テーブル）
create table note_resources (
  id uuid default gen_random_uuid() primary key,
  note_id uuid references notes(id) on delete cascade not null,
  resource_id uuid references resources(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(note_id, resource_id)  -- 同じ組み合わせの重複を防ぐ
);

-- RLS
alter table profiles enable row level security;
alter table resources enable row level security;
alter table note_resources enable row level security;

create policy "自分のprofileだけ操作可能" on profiles
  for all using (auth.uid() = id);

create policy "自分のresourceだけ操作可能" on resources
  for all using (auth.uid() = user_id);

create policy "自分のnote_resourcesだけ操作可能" on note_resources
  for all using (
    exists (
      select 1 from notes
      where notes.id = note_resources.note_id
      and notes.user_id = auth.uid()
    )
  );

-- ユーザー登録時にprofileを自動生成
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, user_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Storage: resourcesバケット（PDF/画像）
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

-- Storage RLS（resourcesバケットの操作権限）
create policy "resources objects read (public)"
  on storage.objects
  for select
  using (bucket_id = 'resources');

create policy "resources objects insert (authenticated)"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'resources' and auth.uid() = owner);

create policy "resources objects update (owner)"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'resources' and auth.uid() = owner);

create policy "resources objects delete (owner)"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'resources' and auth.uid() = owner);


  ----

  -- インストール済み拡張機能の管理
create table user_extensions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  extension_id text not null,
  manifest jsonb not null,
  enabled boolean default true,
  installed_at timestamptz default now(),
  unique(user_id, extension_id)
);

alter table user_extensions enable row level security;

create policy "自分の拡張機能だけ操作可能" on user_extensions
  for all using (auth.uid() = user_id);


-- 拡張機能カタログ（マーケットプレイス用）
create table extensions (
  id text primary key,  -- manifest.jsonのidと同じ
  name text not null,
  description text,
  version text not null,
  author text not null,
  permissions text[] not null,
  ui jsonb not null,
  entry text not null,
  category text not null default 'other',
  install_count integer default 0,
  created_at timestamptz default now() not null
);

-- RLSは読み取りを全員に許可（インストールはuser_extensionsで管理）
alter table extensions enable row level security;

create policy "全員が拡張機能を閲覧可能" on extensions
  for select using (true);

create policy "管理者のみ登録可能" on extensions
  for insert with check (auth.uid() = 'xxxxxxxx');  -- ← 自分のUIDに変える

-- ポモドーロを登録
insert into extensions (id, name, description, version, author, permissions, ui, entry, category)
values (
  'pomodoro-timer',
  'ポモドーロタイマー',
  '25分集中・5分休憩のタイマー。学習セッションを自動記録します。',
  '1.0.0',
  'ni-devx',
  array['timer', 'notification'],
  '{"activityBar": {"icon": "🍅", "label": "ポモドーロ"}, "sidebarPanel": true}',
  'index.html',
  'productivity'
);

---

create or replace function increment_install_count(ext_id text)
returns void as $$
begin
  update extensions
  set install_count = install_count + 1
  where id = ext_id;
end;
$$ language plpgsql security definer;