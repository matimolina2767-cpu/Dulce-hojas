import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import type { Database, Presence } from '../types/database';

type PresenceUpdate = Database['public']['Tables']['presence']['Update'];

/** Presencia de la pareja en tiempo real + acción para actualizar la propia. */
export function usePresence(householdId: string | undefined, userId: string) {
  const [presence, setPresence] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!householdId) return;
    const { data, error: e } = await supabase.from('presence').select('*').eq('household_id', householdId);
    if (e) setError(e.message);
    setPresence(data ?? []);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    load();

    const channel = supabase
      .channel(`presence:${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presence', filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as Partial<Presence>;
            setPresence((prev) => prev.filter((p) => p.user_id !== old.user_id));
            return;
          }
          const row = payload.new as Presence;
          setPresence((prev) => [...prev.filter((p) => p.user_id !== row.user_id), row]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, load]);

  const updateMyPresence = useCallback(
    async (changes: PresenceUpdate) => {
      const patch = { ...changes, last_seen_at: new Date().toISOString() };
      // Actualización optimista
      setPresence((prev) => prev.map((p) => (p.user_id === userId ? { ...p, ...patch } : p)));
      const { error: e } = await supabase.from('presence').update(patch).eq('user_id', userId);
      if (e) {
        setError(e.message);
        await load();
      }
    },
    [userId, load],
  );

  const mine = presence.find((p) => p.user_id === userId) ?? null;
  const partner = presence.find((p) => p.user_id !== userId) ?? null;

  return { presence, mine, partner, loading, error, reload: load, updateMyPresence };
}
