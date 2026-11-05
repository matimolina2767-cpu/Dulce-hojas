import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '../lib/supabase';
import type { Household, HouseholdMember } from '../types/database';

type HouseholdContextValue = {
  userId: string;
  household: Household | null;
  members: HouseholdMember[];
  partner: HouseholdMember | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createHousehold: (name: string, displayName: string) => Promise<void>;
  joinHousehold: (inviteCode: string, displayName: string) => Promise<void>;
};

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: me, error: meError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (meError) setError(meError.message);
    if (!me) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const [h, m] = await Promise.all([
      supabase.from('households').select('*').eq('id', me.household_id).single(),
      supabase.from('household_members').select('*').eq('household_id', me.household_id),
    ]);
    if (h.error) setError(h.error.message);
    setHousehold(h.data ?? null);
    setMembers(m.data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createHousehold = useCallback(
    async (name: string, displayName: string) => {
      const { error: e } = await supabase.rpc('create_household', { p_name: name, p_display_name: displayName });
      if (e) throw new Error(e.message);
      await refresh();
    },
    [refresh],
  );

  const joinHousehold = useCallback(
    async (inviteCode: string, displayName: string) => {
      const { error: e } = await supabase.rpc('join_household', {
        p_invite_code: inviteCode,
        p_display_name: displayName,
      });
      if (e) throw new Error(e.message);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<HouseholdContextValue>(
    () => ({
      userId,
      household,
      members,
      partner: members.find((m) => m.user_id !== userId) ?? null,
      loading,
      error,
      refresh,
      createHousehold,
      joinHousehold,
    }),
    [userId, household, members, loading, error, refresh, createHousehold, joinHousehold],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold debe usarse dentro de <HouseholdProvider>');
  return ctx;
}
