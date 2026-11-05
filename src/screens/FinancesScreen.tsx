import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { useHomeData } from '../hooks/useHomeData';
import { useHousehold } from '../hooks/useHousehold';
import { formatMoney } from '../utils/finance';
import { getFinanceHealth } from '../utils/logoState';
import { theme } from '../utils/theme';

const HEALTH_COLOR = { ok: theme.colors.success, alerta: theme.colors.warning, excedido: theme.colors.danger };

export function FinancesScreen() {
  const { household, members, userId } = useHousehold();
  const { finances } = useHomeData();
  const currency = household?.currency ?? 'ARS';
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');

  const health = getFinanceHealth({ usageRatio: finances.usageRatio });
  const nameOf = (id: string) => members.find((m) => m.user_id === id)?.display_name ?? '—';

  async function addExpense() {
    const value = Number(amount.replace(',', '.'));
    if (!value || value <= 0) return Alert.alert('Monto inválido');
    try {
      await finances.addExpense({ amount: value, description: description || null, paid_by: userId, split_type: 'mitad' });
      setAmount('');
      setDescription('');
    } catch (e) {
      Alert.alert('Ups', e instanceof Error ? e.message : String(e));
    }
  }

  async function saveBudget() {
    const value = Number(budget.replace(',', '.'));
    if (!value || value <= 0) return Alert.alert('Monto inválido');
    try {
      await finances.setMonthlyBudget(value);
      setBudget('');
    } catch (e) {
      Alert.alert('Ups', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.container}
      data={finances.expenses}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={
        <View style={{ gap: 14 }}>
          <Card title="Presupuesto del mes">
            {finances.budgets.map((b) => (
              <Text key={b.category} style={styles.text}>
                {b.category}: {formatMoney(Number(b.spent), currency)} / {formatMoney(Number(b.budget), currency)}
              </Text>
            ))}
            {finances.usageRatio != null && (
              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { width: `${Math.min(finances.usageRatio, 1) * 100}%`, backgroundColor: HEALTH_COLOR[health] }]}
                />
              </View>
            )}
            <TextField placeholder="Presupuesto general del mes" keyboardType="decimal-pad" value={budget} onChangeText={setBudget} />
            <Button title="Guardar presupuesto" variant="secondary" onPress={saveBudget} />
          </Card>

          <Card title="Saldos">
            {finances.balances.map((b) => (
              <Text key={b.user_id} style={styles.text}>
                {b.display_name}: {formatMoney(Number(b.balance), currency)}
              </Text>
            ))}
          </Card>

          <Card title="Nuevo gasto (50/50)">
            <TextField placeholder="Monto" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <TextField placeholder="Descripción" value={description} onChangeText={setDescription} />
            <Button title="Agregar gasto" onPress={addExpense} />
          </Card>

          <Text style={styles.section}>Últimos gastos</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.expense}>
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>{item.description || item.category}</Text>
            <Text style={styles.muted}>
              {item.spent_on} · pagó {nameOf(item.paid_by)}
            </Text>
          </View>
          <Text style={styles.amount}>{formatMoney(Number(item.amount), currency)}</Text>
        </Card>
      )}
      ListEmptyComponent={<Text style={styles.muted}>Todavía no cargaron gastos.</Text>}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.background },
  container: { padding: 20, gap: 14 },
  text: { fontSize: 15, color: theme.colors.text },
  muted: { fontSize: 13, color: theme.colors.muted },
  section: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  expense: { flexDirection: 'row', alignItems: 'center' },
  amount: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: theme.colors.background, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
});
