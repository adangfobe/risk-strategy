import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { BattleSetup, BattleResult, Player, SavedBattle } from '@/types';
import { generateShareCode } from '@/lib/games/shareCode';

type Client = SupabaseClient<Database>;

export interface GameWithMeta {
  id: string;
  name: string | null;
  host_user_id: string;
  share_code: string;
  status: string;
  created_at: string;
  member_count: number;
  replay_count: number;
}

export interface GameMeta {
  id: string;
  name: string | null;
  host_user_id: string;
  share_code: string;
}

function formatSupabaseError(error: { message: string; details?: string; hint?: string }): string {
  const parts = [error.message];
  if (error.details) parts.push(error.details);
  if (error.hint) parts.push(error.hint);
  return parts.join(' — ');
}

export async function listUserGames(supabase: Client): Promise<GameWithMeta[]> {
  const { data: memberships, error } = await supabase
    .from('game_members')
    .select('game_id');

  if (error) throw error;
  if (!memberships?.length) return [];

  const gameIds = memberships.map((m) => m.game_id);
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, name, host_user_id, share_code, status, created_at')
    .in('id', gameIds)
    .order('created_at', { ascending: false });

  if (gamesError) throw gamesError;

  const { data: memberCounts, error: countError } = await supabase
    .from('game_members')
    .select('game_id')
    .in('game_id', gameIds);

  if (countError) throw countError;

  const counts = new Map<string, number>();
  memberCounts?.forEach((row) => {
    counts.set(row.game_id, (counts.get(row.game_id) ?? 0) + 1);
  });

  const { data: battleCounts, error: battleCountError } = await supabase
    .from('battles')
    .select('game_id')
    .in('game_id', gameIds);

  if (battleCountError) throw battleCountError;

  const replayCounts = new Map<string, number>();
  battleCounts?.forEach((row) => {
    replayCounts.set(row.game_id, (replayCounts.get(row.game_id) ?? 0) + 1);
  });

  return (games ?? []).map((g) => ({
    ...g,
    member_count: counts.get(g.id) ?? 0,
    replay_count: replayCounts.get(g.id) ?? 0,
  }));
}

export async function createGame(
  supabase: Client,
  userId: string,
  name: string | null,
  roster: Pick<Player, 'name' | 'color'>[]
): Promise<{ gameId: string; shareCode: string }> {
  const shareCode = generateShareCode();

  const { data, error } = await supabase.rpc('create_game_with_roster', {
    game_name: name?.trim() || '',
    share_code: shareCode,
    roster: roster.map((p) => ({ name: p.name, color: p.color })),
  });

  if (error) throw new Error(formatSupabaseError(error));

  const result = data as { game_id: string; share_code: string } | null;
  if (!result?.game_id) {
    throw new Error(
      'Game was not created. Run supabase/migrations/002_fix_create_game_rls.sql in the Supabase SQL Editor.'
    );
  }

  return { gameId: result.game_id, shareCode: result.share_code };
}

export async function loadGameMeta(supabase: Client, gameId: string): Promise<GameMeta> {
  const { data, error } = await supabase
    .from('games')
    .select('id, name, host_user_id, share_code')
    .eq('id', gameId)
    .single();

  if (error) throw new Error(formatSupabaseError(error));
  return data;
}

export async function joinGameByCode(supabase: Client, code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_game_by_code', { code });
  if (error) throw error;
  return data;
}

export async function loadGamePlayers(supabase: Client, gameId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('game_players')
    .select('id, name, color')
    .eq('game_id', gameId)
    .order('seat_order');

  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
  }));
}

export async function loadGameBattles(supabase: Client, gameId: string): Promise<SavedBattle[]> {
  const { data, error } = await supabase
    .from('battles')
    .select('id, setup, result, attacker_player_id, defender_player_id, created_at')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatSupabaseError(error));

  return (data ?? []).map((b) => ({
    id: b.id,
    timestamp: new Date(b.created_at).getTime(),
    setup: b.setup as BattleSetup,
    result: b.result as BattleResult,
    attackerPlayerId: b.attacker_player_id,
    defenderPlayerId: b.defender_player_id,
  }));
}

export async function loadBattleById(supabase: Client, battleId: string): Promise<SavedBattle> {
  const { data, error } = await supabase
    .from('battles')
    .select('id, setup, result, attacker_player_id, defender_player_id, created_at')
    .eq('id', battleId)
    .single();

  if (error) throw new Error(formatSupabaseError(error));

  return {
    id: data.id,
    timestamp: new Date(data.created_at).getTime(),
    setup: data.setup as BattleSetup,
    result: data.result as BattleResult,
    attackerPlayerId: data.attacker_player_id,
    defenderPlayerId: data.defender_player_id,
  };
}

export async function saveBattle(
  supabase: Client,
  gameId: string,
  setup: BattleSetup,
  result: BattleResult,
  attackerPlayerId: string | null,
  defenderPlayerId: string | null
): Promise<string> {
  const { data, error } = await supabase
    .from('battles')
    .insert({
      game_id: gameId,
      setup,
      result,
      attacker_player_id: attackerPlayerId,
      defender_player_id: defenderPlayerId,
    })
    .select('id')
    .single();

  if (error) throw new Error(formatSupabaseError(error));
  return data.id;
}
