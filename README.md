# Dulce Hogar 🏡

App para parejas (Expo + React Native + Supabase): presencia en casa, estado visual y finanzas compartidas, resumidos en un logo con 7 estados.

## Puesta en marcha

1. `npm install`
2. Copiá `.env.example` a `.env` y completá `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Aplicá la migración `supabase/migrations/20261104000000_init_dulce_hogar.sql`
   (`npx supabase link && npx supabase db push`, o pegala en el SQL Editor).
4. `npx expo start -c`

## Estructura

```
App.tsx                      Providers + RootNavigator
supabase/migrations/         Esquema, RLS, vistas, RPCs y realtime
src/
  lib/        env.ts (lee .env), supabase.ts (cliente)
  types/      database.ts (tipos de las tablas)
  navigation/ RootNavigator (auth → hogar → tabs), MainTabs
  screens/    Auth, HouseholdSetup, Home, Presence, Finances
  components/ DulceHogarLogo, PresenceCard, ui/*
  hooks/      useSession, useHousehold, usePresence, useFinances, useLogoState, useHomeData
  utils/      logoState.ts (7 estados), finance.ts, theme.ts
```

## Base de datos

| Tabla / vista       | Para qué |
|---------------------|----------|
| `households`        | El hogar (código de invitación, moneda, geocerca opcional) |
| `household_members` | La pareja (máx. 2; 1 hogar por usuario) |
| `presence`          | `at_home`, `visual_status`, nota, ubicación, `last_seen_at` (realtime) |
| `presence_events`   | Historial de llegadas/salidas (trigger) |
| `budgets`           | Presupuesto mensual por categoría (`general` = global) |
| `expenses`          | Gastos con reparto: `mitad`, `solo_pagador`, `solo_pareja`, `personalizado` |
| `settlements`       | Transferencias para saldar deudas |
| `member_balances`   | Vista: saldo neto (positivo = te deben) |
| `budget_status`     | Vista: gastado vs presupuesto del mes |

Todas las tablas tienen RLS: sólo los miembros del hogar ven/editan sus datos. Onboarding vía RPC `create_household` / `join_household`.

## Los 7 estados del logo (`src/utils/logoState.ts`)

Prioridad de arriba hacia abajo:

| Estado | Condición |
|---|---|
| `sin_sincronizar` | Sin datos de presencia o todos con más de 12 h sin actualizar |
| `presupuesto_excedido` | Gasto del mes > 100% del presupuesto (las ventanas siguen mostrando quién está) |
| `hogar_vacio` | Nadie en casa |
| `medio_hogar` | Uno en casa, presupuesto < 80% |
| `medio_hogar_alerta` | Uno en casa, presupuesto 80–100% |
| `hogar_completo` | Los dos en casa, presupuesto < 80% |
| `hogar_completo_alerta` | Los dos en casa, presupuesto 80–100% |

Umbrales configurables en `LOGO_THRESHOLDS`; colores, ventanas encendidas, corazón y animación en `LOGO_VISUALS`. `DulceHogarLogo` es un placeholder dibujado con Views: reemplazalo por el arte final manteniendo la prop `visual`.
