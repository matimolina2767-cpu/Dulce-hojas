import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ESTADO_VISUAL_INFO } from '../components/PresenceCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { useHomeData } from '../hooks/useHomeData';
import type { EstadoVisual } from '../types/database';
import { theme } from '../utils/theme';

export function PresenceScreen() {
  const { presence } = useHomeData();
  const mine = presence.mine;
  const [note, setNote] = useState(mine?.status_note ?? '');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card title="¿Estás en casa?">
        <View style={styles.row}>
          <Text style={styles.text}>{mine?.at_home ? '🏠 En casa' : '🌆 Afuera'}</Text>
          <Switch
            value={mine?.at_home ?? false}
            onValueChange={(v) => presence.updateMyPresence({ at_home: v, source: 'manual' })}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>
      </Card>

      <Card title="Tu estado">
        <View style={styles.grid}>
          {(Object.keys(ESTADO_VISUAL_INFO) as EstadoVisual[]).map((key) => {
            const selected = mine?.visual_status === key;
            return (
              <Pressable
                key={key}
                onPress={() => presence.updateMyPresence({ visual_status: key })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={styles.chipEmoji}>{ESTADO_VISUAL_INFO[key].emoji}</Text>
                <Text style={[styles.chipText, selected && { color: '#fff' }]}>{ESTADO_VISUAL_INFO[key].label}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextField placeholder="Una notita (opcional)" maxLength={80} value={note} onChangeText={setNote} />
        <Button title="Guardar nota" variant="secondary" onPress={() => presence.updateMyPresence({ status_note: note || null })} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.background },
  container: { padding: 20, gap: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  text: { fontSize: 16, color: theme.colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: theme.colors.background },
  chipSelected: { backgroundColor: theme.colors.primary },
  chipEmoji: { fontSize: 16 },
  chipText: { fontSize: 14, color: theme.colors.text },
});
