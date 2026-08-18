-- Fix: host can read their game immediately after insert (before member row exists)
-- Also adds atomic create_game_with_roster RPC.

create policy "games_select_host"
  on public.games for select
  using (auth.uid() = host_user_id);

-- Host can see their own membership rows when bootstrapping a new game
create policy "game_members_select_self"
  on public.game_members for select
  using (auth.uid() = user_id);

create or replace function public.create_game_with_roster(
  game_name text,
  share_code text,
  roster jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_game_id uuid;
  new_share_code text;
  player jsonb;
  idx int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if roster is null or jsonb_array_length(roster) < 2 then
    raise exception 'At least two players are required';
  end if;

  new_share_code := upper(trim(share_code));

  insert into public.games (name, host_user_id, share_code)
  values (nullif(trim(game_name), ''), auth.uid(), new_share_code)
  returning id into new_game_id;

  insert into public.game_members (game_id, user_id)
  values (new_game_id, auth.uid());

  for player in select value from jsonb_array_elements(roster)
  loop
    insert into public.game_players (game_id, name, color, seat_order, user_id)
    values (
      new_game_id,
      player->>'name',
      player->>'color',
      idx,
      case when idx = 0 then auth.uid() else null end
    );
    idx := idx + 1;
  end loop;

  return jsonb_build_object('game_id', new_game_id, 'share_code', new_share_code);
end;
$$;
