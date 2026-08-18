import type { BattleSetup, BattleResult, PlayerColor } from '@/types';

export type GameStatus = 'active' | 'completed' | 'archived';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          name: string | null;
          host_user_id: string;
          share_code: string;
          status: GameStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          host_user_id: string;
          share_code: string;
          status?: GameStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          host_user_id?: string;
          share_code?: string;
          status?: GameStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_members: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      game_players: {
        Row: {
          id: string;
          game_id: string;
          user_id: string | null;
          name: string;
          color: PlayerColor;
          seat_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id?: string | null;
          name: string;
          color: string;
          seat_order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string | null;
          name?: string;
          color?: string;
          seat_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      battles: {
        Row: {
          id: string;
          game_id: string;
          setup: BattleSetup;
          result: BattleResult;
          attacker_player_id: string | null;
          defender_player_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          setup: BattleSetup;
          result: BattleResult;
          attacker_player_id?: string | null;
          defender_player_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          setup?: BattleSetup;
          result?: BattleResult;
          attacker_player_id?: string | null;
          defender_player_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      favorite_strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          strategy_text: string;
          side: 'attacker' | 'defender' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          strategy_text: string;
          side?: 'attacker' | 'defender' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          strategy_text?: string;
          side?: 'attacker' | 'defender' | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_game_with_roster: {
        Args: { game_name: string; share_code: string; roster: unknown };
        Returns: { game_id: string; share_code: string };
      };
      join_game_by_code: {
        Args: { code: string };
        Returns: string;
      };
      is_game_member: {
        Args: { game_uuid: string };
        Returns: boolean;
      };
    };
    Enums: {
      game_status: GameStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Game = Database['public']['Tables']['games']['Row'];
export type GamePlayer = Database['public']['Tables']['game_players']['Row'];
export type BattleRow = Database['public']['Tables']['battles']['Row'];
export type FavoriteStrategy = Database['public']['Tables']['favorite_strategies']['Row'];
