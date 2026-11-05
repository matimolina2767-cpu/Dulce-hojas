import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';

import { DulceHogarLogo } from '../components/DulceHogarLogo';
import { PresenceCard } from '../components/PresenceCard';
import { Card } from '../components/ui/Card';
import { useHomeData } from '../hooks/useHomeData';
import { useHousehold } from '../hooks/useHousehold';
import { formatMoney } from '../utils/finance';
import { theme } from '../utils/theme';

export function HomeScreen() {
  const { household, members, userId } = useHousehold();
  const { presence, finances, logo } = useHomeData();
  const me = members.find((m) => m.user_id === userId);
  const partner = members.find((m) => m.user_id !== userId);
  const myBalance = Number(finances.balances.find((b) => b.user_id === userId)?.balance ?? 0);
  const currency = household?.currency ?? 'ARS';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            presence.reload();
            finances.reload();
          }}
        />
      }
    >
      <DulceHogarLogo visual={logo} />

      <PresenceCard name={me?.display_name ?? 'Yo'} presence={presence.mine} />
      {partner ? (
        <PresenceCard name={partner.display_name} presence={presence.partner} />
      ) : (
        <Card title="Invitá a tu pareja">
          <Text style={styles.text}>
            Compartile este código: <Text style={styles.code}>{household?.invite_code}</Text>
          </Text>
        </Card>
      )}

      <Card title="Este mes">
        <Text style={styles.text}>
          {finances.usageRatio == null
            ? 'Todavía no hay presupuesto cargado.'
            : `Usaron el ${Math.round(finances.usageRatio * 100)}% del presupuesto.`}
        </Text>
        <Text style={styles.text}>
          {myBalance === 0
            ? 'Están a mano 🤝'
            : myBalance > 0
              ? `Tu pareja te debe ${formatMoney(myBalance, currency)}`
              : `Le debés ${formatMoney(-myBalance, currency)} a tu pareja`}
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.background },
  container: { padding: 20, gap: 14 },
  text: { fontSize: 15, color: theme.colors.text },
  code: { fontWeight: '800', letterSpacing: 2 },
});
