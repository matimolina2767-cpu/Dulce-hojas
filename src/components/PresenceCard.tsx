import { StyleSheet, Text, View } from 'react-native';

import type { EstadoVisual, Presence } from '../types/database';
import { theme } from '../utils/theme';
import { Card } from './ui/Card';

export const ESTADO_VISUAL_INFO: Record<EstadoVisual, { emoji: string; label: string }> = {
  disponible: { emoji: '😊', label: 'Disponible' },
  ocupado: { emoji: '💼', label: 'Ocupado/a' },
  descansando: { emoji: '🛋️', label: 'Descansando' },
  durmiendo: { emoji: '😴', label: 'Durmiendo' },
  fuera: { emoji: '🚶', label: 'Fuera' },
  te_extrano: { emoji: '🥺', label: 'Te extraño' },
};

export function PresenceCard({ name, presence }: { name: string; presence: Presence | null }) {
  const info = presence ? ESTADO_VISUAL_INFO[presence.visual_status] : null;
  return (
    <Card style={styles.card}>
      <Text style={styles.emoji}>{info?.emoji ?? '❔'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.sub}>
          {presence ? `${presence.at_home ? '🏠 En casa' : '🌆 Afuera'} · ${info?.label}` : 'Sin datos todavía'}
        </Text>
        {presence?.status_note ? <Text style={styles.note}>“{presence.status_note}”</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 32 },
  name: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  sub: { fontSize: 14, color: theme.colors.muted },
  note: { fontSize: 13, color: theme.colors.text, marginTop: 2, fontStyle: 'italic' },
});
