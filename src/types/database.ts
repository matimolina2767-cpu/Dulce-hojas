/**
 * Tipos de la base de datos (formato de `supabase gen types typescript`).
 * Escritos a mano a partir de supabase/migrations/20261104000000_init_dulce_hogar.sql.
 * Cuando tengas el proyecto enlazado, regenerálos con:
 *   npx supabase gen types typescript --linked > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EstadoVisual =
  | 'disponible'
  | 'ocupado'
  | 'descansando'
  | 'durmiendo'
  | 'fuera'
  | 'te_extrano';
export type FuentePresencia = 'manual' | 'geocerca' | 'wifi';
export type TipoReparto = 'mitad' | 'solo_pagador' | 'solo_pareja' | 'personalizado';

type HouseholdRow = {
  id: string;
  name: string;
  invite_code: string;
  currency: string;
  home_latitude: number | null;
  home_longitude: number | null;
  home_radius_m: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      households: {
        Row: HouseholdRow;
        Insert: Partial<HouseholdRow>;
        Update: Partial<HouseholdRow>;
        Relationships: [];
      };
      household_members: {
        Row: {
          household_id: string;
          user_id: string;
          display_name: string;
          avatar_color: string;
          joined_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          display_name: string;
          avatar_color?: string;
          joined_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_color?: string;
        };
        Relationships: [];
      };
      presence: {
        Row: {
          user_id: string;
          household_id: string;
          at_home: boolean;
          visual_status: EstadoVisual;
          status_note: string | null;
          source: FuentePresencia;
          latitude: number | null;
          longitude: number | null;
          accuracy_m: number | null;
          last_seen_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          household_id: string;
          at_home?: boolean;
          visual_status?: EstadoVisual;
          status_note?: string | null;
          source?: FuentePresencia;
          latitude?: number | null;
          longitude?: number | null;
          accuracy_m?: number | null;
          last_seen_at?: string;
        };
        Update: {
          at_home?: boolean;
          visual_status?: EstadoVisual;
          status_note?: string | null;
          source?: FuentePresencia;
          latitude?: number | null;
          longitude?: number | null;
          accuracy_m?: number | null;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      presence_events: {
        Row: {
          id: number;
          household_id: string;
          user_id: string;
          at_home: boolean;
          source: FuentePresencia;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          household_id: string;
          category: string;
          period_month: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          amount: number;
          category?: string;
          period_month?: string;
        };
        Update: {
          amount?: number;
          category?: string;
          period_month?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          paid_by: string;
          amount: number;
          category: string;
          description: string | null;
          spent_on: string;
          split_type: TipoReparto;
          payer_share: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          paid_by: string;
          amount: number;
          category?: string;
          description?: string | null;
          spent_on?: string;
          split_type?: TipoReparto;
          payer_share?: number;
        };
        Update: {
          paid_by?: string;
          amount?: number;
          category?: string;
          description?: string | null;
          spent_on?: string;
          split_type?: TipoReparto;
          payer_share?: number;
        };
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          household_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          note: string | null;
          settled_on: string;
          created_at: string;
        };
        Insert: {
          household_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          note?: string | null;
          settled_on?: string;
        };
        Update: {
          amount?: number;
          note?: string | null;
          settled_on?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      member_balances: {
        Row: {
          household_id: string;
          user_id: string;
          display_name: string;
          balance: number;
        };
        Relationships: [];
      };
      budget_status: {
        Row: {
          household_id: string;
          period_month: string;
          category: string;
          budget: number;
          spent: number;
          usage_ratio: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_household: {
        Args: { p_name: string; p_display_name: string };
        Returns: HouseholdRow;
      };
      join_household: {
        Args: { p_invite_code: string; p_display_name: string };
        Returns: HouseholdRow;
      };
      is_household_member: {
        Args: { hid: string };
        Returns: boolean;
      };
    };
    Enums: {
      estado_visual: EstadoVisual;
      fuente_presencia: FuentePresencia;
      tipo_reparto: TipoReparto;
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type Views<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row'];

export type Household = Tables<'households'>;
export type HouseholdMember = Tables<'household_members'>;
export type Presence = Tables<'presence'>;
export type Expense = Tables<'expenses'>;
export type Budget = Tables<'budgets'>;
export type Settlement = Tables<'settlements'>;
export type MemberBalance = Views<'member_balances'>;
export type BudgetStatus = Views<'budget_status'>;
