import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabase';
import type { BudgetStatus, Database, Expense, MemberBalance } from '../types/database';
import { currentPeriodMonth, monthlyUsageRatio } from '../utils/finance';

type NewExpense = Omit<Database['public']['Tables']['expenses']['Insert'], 'household_id'>;

/** Gastos recientes, estado del presupuesto del mes y saldos de la pareja. */
export function useFinances(householdId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!householdId) return;
    const period = currentPeriodMonth();
    const [e, b, s] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('household_id', householdId)
        .order('spent_on', { ascending: false })
        .limit(50),
      supabase.from('budget_status').select('*').eq('household_id', householdId).eq('period_month', period),
      supabase.from('member_balances').select('*').eq('household_id', householdId),
    ]);
    setError(e.error?.message ?? b.error?.message ?? s.error?.message ?? null);
    setExpenses(e.data ?? []);
    setBudgets(b.data ?? []);
    setBalances(s.data ?? []);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    load();

    // Las vistas no emiten eventos realtime: recargamos ante cambios en las tablas base.
    const filter = `household_id=eq.${householdId}`;
    const channel = supabase
      .channel(`finances:${householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements', filter }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, load]);

  const addExpense = useCallback(
    async (expense: NewExpense) => {
      if (!householdId) return;
      const { error: e } = await supabase.from('expenses').insert({ ...expense, household_id: householdId });
      if (e) throw new Error(e.message);
      await load();
    },
    [householdId, load],
  );

  const setMonthlyBudget = useCallback(
    async (amount: number, category = 'general') => {
      if (!householdId) return;
      const { error: e } = await supabase
        .from('budgets')
        .upsert(
          { household_id: householdId, category, amount, period_month: currentPeriodMonth() },
          { onConflict: 'household_id,category,period_month' },
        );
      if (e) throw new Error(e.message);
      await load();
    },
    [householdId, load],
  );

  const settleUp = useCallback(
    async (fromUser: string, toUser: string, amount: number, note?: string) => {
      if (!householdId) return;
      const { error: e } = await supabase
        .from('settlements')
        .insert({ household_id: householdId, from_user: fromUser, to_user: toUser, amount, note });
      if (e) throw new Error(e.message);
      await load();
    },
    [householdId, load],
  );

  const usageRatio = useMemo(() => monthlyUsageRatio(budgets), [budgets]);

  return { expenses, budgets, balances, usageRatio, loading, error, reload: load, addExpense, setMonthlyBudget, settleUp };
}
