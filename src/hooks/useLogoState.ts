import { useEffect, useMemo, useState } from 'react';

import type { Presence } from '../types/database';
import { resolveLogoVisual, type LogoVisual } from '../utils/logoState';

/**
 * Combina presencia + finanzas y devuelve el estado visual del logo.
 * Recibe los datos ya cargados (de usePresence / useFinances) para no
 * duplicar suscripciones realtime.
 */
export function useLogoState(params: {
  presence: Presence[];
  usageRatio: number | null;
  loading?: boolean;
  expectedMembers?: number;
}): LogoVisual {
  const { presence, usageRatio, loading, expectedMembers = 2 } = params;

  // Re-evaluar cada minuto para que la presencia vieja pase a "sin_sincronizar".
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(
    () =>
      resolveLogoVisual({
        presence: loading
          ? []
          : presence.map((p) => ({ userId: p.user_id, atHome: p.at_home, lastSeenAt: p.last_seen_at })),
        finances: { usageRatio },
        expectedMembers,
        now,
      }),
    [presence, usageRatio, loading, expectedMembers, now],
  );
}
