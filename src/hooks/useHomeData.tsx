import { createContext, useContext, type ReactNode } from 'react';

import { useFinances } from './useFinances';
import { useHousehold } from './useHousehold';
import { useLogoState } from './useLogoState';
import { usePresence } from './usePresence';

type HomeData = {
  presence: ReturnType<typeof usePresence>;
  finances: ReturnType<typeof useFinances>;
  logo: ReturnType<typeof useLogoState>;
};

const HomeDataContext = createContext<HomeData | null>(null);

/**
 * Una única suscripción realtime de presencia y finanzas para toda la app;
 * las pantallas leen desde aquí con useHomeData().
 */
export function HomeDataProvider({ children }: { children: ReactNode }) {
  const { household, userId } = useHousehold();
  const presence = usePresence(household?.id, userId);
  const finances = useFinances(household?.id);
  const logo = useLogoState({
    presence: presence.presence,
    usageRatio: finances.usageRatio,
    loading: presence.loading,
  });

  return <HomeDataContext.Provider value={{ presence, finances, logo }}>{children}</HomeDataContext.Provider>;
}

export function useHomeData() {
  const ctx = useContext(HomeDataContext);
  if (!ctx) throw new Error('useHomeData debe usarse dentro de <HomeDataProvider>');
  return ctx;
}
