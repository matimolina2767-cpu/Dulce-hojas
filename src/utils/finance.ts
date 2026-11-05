import type { BudgetStatus } from '../types/database';

/** Primer día del mes en formato YYYY-MM-DD (coincide con budgets.period_month). */
export function currentPeriodMonth(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function formatMoney(amount: number, currency = 'ARS', locale = 'es-AR'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Ratio de uso del presupuesto del mes.
 * Si existe una categoría "general" se usa como presupuesto global;
 * si no, se suman todas las categorías.
 */
export function monthlyUsageRatio(rows: BudgetStatus[]): number | null {
  if (rows.length === 0) return null;
  const general = rows.find((r) => r.category === 'general');
  const budget = general ? Number(general.budget) : rows.reduce((s, r) => s + Number(r.budget), 0);
  const spent = general ? Number(general.spent) : rows.reduce((s, r) => s + Number(r.spent), 0);
  if (budget <= 0) return null;
  return spent / budget;
}
