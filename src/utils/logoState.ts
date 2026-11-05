/**
 * Lógica de los 7 estados visuales del logo de Dulce Hogar.
 *
 * El logo combina dos dimensiones:
 *   • Presencia: cuántos miembros de la pareja están en casa (0, 1 o 2).
 *   • Finanzas: salud del presupuesto del mes (ok / alerta / excedido).
 *
 * Reglas, por prioridad:
 *   1. sin_sincronizar      → faltan datos o están desactualizados.
 *   2. presupuesto_excedido → el gasto del mes superó el presupuesto (pisa la presencia).
 *   3. hogar_vacio          → nadie en casa.
 *   4. medio_hogar(_alerta) → una persona en casa.
 *   5. hogar_completo(_alerta) → los dos en casa.
 *
 * Este archivo no depende de React ni de Supabase: es una función pura
 * fácil de testear y de reutilizar (p. ej. en un widget o notificación).
 */

export const LOGO_STATES = [
  'hogar_completo',
  'hogar_completo_alerta',
  'medio_hogar',
  'medio_hogar_alerta',
  'hogar_vacio',
  'presupuesto_excedido',
  'sin_sincronizar',
] as const;

export type LogoStateKey = (typeof LOGO_STATES)[number];

export type FinanceHealth = 'ok' | 'alerta' | 'excedido';

export type LogoVisual = {
  key: LogoStateKey;
  label: string;
  description: string;
  colors: {
    roof: string;
    walls: string;
    door: string;
    windowLit: string;
    windowOff: string;
    background: string;
  };
  /** Cuántas ventanas encendidas (0–2), una por persona en casa. */
  litWindows: 0 | 1 | 2;
  /** Corazón sobre el techo. */
  heart: 'lleno' | 'medio' | 'roto' | 'ninguno';
  /** Pista de animación para el componente. */
  animation: 'latido' | 'respirar' | 'temblor' | 'ninguna';
};

export type PresenceInput = {
  userId: string;
  atHome: boolean;
  lastSeenAt: string | Date;
};

export type FinanceInput = {
  /** Gasto del mes / presupuesto del mes. null = sin presupuesto cargado. */
  usageRatio: number | null;
};

export type LogoStateInput = {
  /** Presencia de cada miembro del hogar. */
  presence: PresenceInput[];
  /** Cantidad de miembros esperados en el hogar (pareja = 2). */
  expectedMembers?: number;
  finances: FinanceInput | null;
  /** Momento de referencia (inyectable para tests). */
  now?: Date;
};

export const LOGO_THRESHOLDS = {
  /** A partir de este % del presupuesto se considera "alerta". */
  alertRatio: 0.8,
  /** Por encima de este % se considera "excedido". */
  exceededRatio: 1,
  /** Si nadie actualizó su presencia en este tiempo, el dato se considera viejo. */
  staleAfterMs: 1000 * 60 * 60 * 12,
};

const PALETTE = {
  rosa: '#E8A0BF',
  rosaSuave: '#F6D1E1',
  crema: '#FFF6EC',
  madera: '#B07D62',
  luz: '#FFD56B',
  apagada: '#6B6F80',
  ambar: '#F4A259',
  rojo: '#D64545',
  gris: '#B8B8C0',
  noche: '#2E3047',
};

export const LOGO_VISUALS: Record<LogoStateKey, LogoVisual> = {
  hogar_completo: {
    key: 'hogar_completo',
    label: 'Hogar completo',
    description: 'Están los dos en casa y las finanzas en orden.',
    colors: {
      roof: PALETTE.rosa,
      walls: PALETTE.crema,
      door: PALETTE.madera,
      windowLit: PALETTE.luz,
      windowOff: PALETTE.apagada,
      background: PALETTE.rosaSuave,
    },
    litWindows: 2,
    heart: 'lleno',
    animation: 'latido',
  },
  hogar_completo_alerta: {
    key: 'hogar_completo_alerta',
    label: 'Juntos, cuidando el bolsillo',
    description: 'Están los dos en casa, pero el presupuesto está cerca del límite.',
    colors: {
      roof: PALETTE.ambar,
      walls: PALETTE.crema,
      door: PALETTE.madera,
      windowLit: PALETTE.luz,
      windowOff: PALETTE.apagada,
      background: '#FDE8D2',
    },
    litWindows: 2,
    heart: 'lleno',
    animation: 'respirar',
  },
  medio_hogar: {
    key: 'medio_hogar',
    label: 'Esperándote',
    description: 'Hay una persona en casa y las finanzas en orden.',
    colors: {
      roof: PALETTE.rosa,
      walls: PALETTE.crema,
      door: PALETTE.madera,
      windowLit: PALETTE.luz,
      windowOff: PALETTE.apagada,
      background: PALETTE.rosaSuave,
    },
    litWindows: 1,
    heart: 'medio',
    animation: 'respirar',
  },
  medio_hogar_alerta: {
    key: 'medio_hogar_alerta',
    label: 'Esperándote (ojo con los gastos)',
    description: 'Hay una persona en casa y el presupuesto está cerca del límite.',
    colors: {
      roof: PALETTE.ambar,
      walls: PALETTE.crema,
      door: PALETTE.madera,
      windowLit: PALETTE.luz,
      windowOff: PALETTE.apagada,
      background: '#FDE8D2',
    },
    litWindows: 1,
    heart: 'medio',
    animation: 'respirar',
  },
  hogar_vacio: {
    key: 'hogar_vacio',
    label: 'Casa tranquila',
    description: 'No hay nadie en casa.',
    colors: {
      roof: '#8E8FB5',
      walls: '#E4E4EE',
      door: '#7A6A60',
      windowLit: PALETTE.luz,
      windowOff: PALETTE.apagada,
      background: PALETTE.noche,
    },
    litWindows: 0,
    heart: 'ninguno',
    animation: 'ninguna',
  },
  presupuesto_excedido: {
    key: 'presupuesto_excedido',
    label: 'Presupuesto excedido',
    description: 'Este mes se gastó más de lo presupuestado.',
    colors: {
      roof: PALETTE.rojo,
      walls: PALETTE.crema,
      door: PALETTE.madera,
      windowLit: PALETTE.luz,
      windowOff: PALETTE.apagada,
      background: '#F8D7D7',
    },
    litWindows: 0, // se sobreescribe con la presencia real en resolveLogoVisual
    heart: 'roto',
    animation: 'temblor',
  },
  sin_sincronizar: {
    key: 'sin_sincronizar',
    label: 'Sincronizando…',
    description: 'Todavía no hay datos de presencia o están desactualizados.',
    colors: {
      roof: PALETTE.gris,
      walls: '#F0F0F3',
      door: '#9A9AA5',
      windowLit: PALETTE.gris,
      windowOff: PALETTE.gris,
      background: '#F0F0F3',
    },
    litWindows: 0,
    heart: 'ninguno',
    animation: 'ninguna',
  },
};

export function getFinanceHealth(finances: FinanceInput | null): FinanceHealth {
  const ratio = finances?.usageRatio;
  if (ratio == null || Number.isNaN(ratio)) return 'ok';
  if (ratio > LOGO_THRESHOLDS.exceededRatio) return 'excedido';
  if (ratio >= LOGO_THRESHOLDS.alertRatio) return 'alerta';
  return 'ok';
}

function isStale(lastSeenAt: string | Date, now: Date): boolean {
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return true;
  return now.getTime() - t > LOGO_THRESHOLDS.staleAfterMs;
}

/** Cuenta personas en casa (ignorando registros desactualizados). */
export function countAtHome(presence: PresenceInput[], now: Date = new Date()): number {
  return presence.filter((p) => p.atHome && !isStale(p.lastSeenAt, now)).length;
}

export function computeLogoState(input: LogoStateInput): LogoStateKey {
  const now = input.now ?? new Date();
  const expected = input.expectedMembers ?? 2;
  const { presence } = input;

  const allStale = presence.length > 0 && presence.every((p) => isStale(p.lastSeenAt, now));
  if (presence.length === 0 || allStale) return 'sin_sincronizar';

  const health = getFinanceHealth(input.finances);
  if (health === 'excedido') return 'presupuesto_excedido';

  const atHome = Math.min(countAtHome(presence, now), expected);
  const alerta = health === 'alerta';

  if (atHome === 0) return 'hogar_vacio';
  if (atHome >= expected) return alerta ? 'hogar_completo_alerta' : 'hogar_completo';
  return alerta ? 'medio_hogar_alerta' : 'medio_hogar';
}

/** Estado + visual listo para renderizar. */
export function resolveLogoVisual(input: LogoStateInput): LogoVisual {
  const key = computeLogoState(input);
  const visual = LOGO_VISUALS[key];
  if (key === 'presupuesto_excedido') {
    // Aunque el techo esté en rojo, las ventanas siguen mostrando quién está en casa.
    const lit = Math.min(countAtHome(input.presence, input.now), 2) as 0 | 1 | 2;
    return { ...visual, litWindows: lit };
  }
  return visual;
}
