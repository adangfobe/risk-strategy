-- Risk Battle Simulator — initial schema
-- Run this in the Supabase SQL Editor after creating your project.

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Games (shared session container)
-- ---------------------------------------------------------------------------
create type public.game_status as enum ('active', 'completed', 'archived');

create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text,
  host_user_id uuid not null references auth.users (id) on delete cascade,
  share_code text not null unique,
  status public.game_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index games_share_code_idx on public.games (share_code);
create index games_host_user_id_idx on public.games (host_user_id);

-- ---------------------------------------------------------------------------
-- Game members (accounts that can access a game and its replays)
-- ---------------------------------------------------------------------------
create table public.game_members (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create index game_members_user_id_idx on public.game_members (user_id);

-- ---------------------------------------------------------------------------
-- Game players (in-table seats — distinct from auth accounts)
-- ---------------------------------------------------------------------------
create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  color text not null,
  seat_order int not null,
  created_at timestamptz not null default now()
);

create index game_players_game_id_idx on public.game_players (game_id);

-- ---------------------------------------------------------------------------
-- Battles / replays (shared with all game members)
-- ---------------------------------------------------------------------------
create table public.battles (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  setup jsonb not null,
  result jsonb not null,
  attacker_player_id uuid references public.game_players (id) on delete set null,
  defender_player_id uuid references public.game_players (id) on delete set null,
  created_at timestamptz not null default now()
);

create index battles_game_id_idx on public.battles (game_id);
create index battles_created_at_idx on public.battles (created_at desc);

-- ---------------------------------------------------------------------------
-- Favorite strategies (private per user)
-- ---------------------------------------------------------------------------
create table public.favorite_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  strategy_text text not null,
  side text check (side is null or side in ('attacker', 'defender')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index favorite_strategies_user_id_idx on public.favorite_strategies (user_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_game_member(game_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_members
    where game_id = game_uuid
      and user_id = auth.uid()
  );
$$;

create or replace function public.join_game_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  game_uuid uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into game_uuid
  from public.games
  where share_code = upper(trim(code))
    and status = 'active';

  if game_uuid is null then
    raise exception 'Invalid or expired share code';
  end if;

  insert into public.game_members (game_id, user_id)
  values (game_uuid, auth.uid())
  on conflict (game_id, user_id) do nothing;

  return game_uuid;
end;
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_members enable row level security;
alter table public.game_players enable row level security;
alter table public.battles enable row level security;
alter table public.favorite_strategies enable row level security;

-- Profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Games
create policy "games_select_member"
  on public.games for select
  using (public.is_game_member(id));

create policy "games_insert_host"
  on public.games for insert
  with check (auth.uid() = host_user_id);

create policy "games_update_host"
  on public.games for update
  using (auth.uid() = host_user_id);

-- Game members
create policy "game_members_select_member"
  on public.game_members for select
  using (public.is_game_member(game_id));

create policy "game_members_insert_self"
  on public.game_members for insert
  with check (auth.uid() = user_id);

-- Game players
create policy "game_players_select_member"
  on public.game_players for select
  using (public.is_game_member(game_id));

create policy "game_players_insert_member"
  on public.game_players for insert
  with check (public.is_game_member(game_id));

create policy "game_players_update_member"
  on public.game_players for update
  using (public.is_game_member(game_id));

create policy "game_players_delete_member"
  on public.game_players for delete
  using (public.is_game_member(game_id));

-- Battles (replays)
create policy "battles_select_member"
  on public.battles for select
  using (public.is_game_member(game_id));

create policy "battles_insert_member"
  on public.battles for insert
  with check (public.is_game_member(game_id));

-- Favorite strategies (private)
create policy "favorites_select_own"
  on public.favorite_strategies for select
  using (auth.uid() = user_id);

create policy "favorites_insert_own"
  on public.favorite_strategies for insert
  with check (auth.uid() = user_id);

create policy "favorites_update_own"
  on public.favorite_strategies for update
  using (auth.uid() = user_id);

create policy "favorites_delete_own"
  on public.favorite_strategies for delete
  using (auth.uid() = user_id);
