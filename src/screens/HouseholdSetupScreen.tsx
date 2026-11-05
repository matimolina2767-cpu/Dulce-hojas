import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { useHousehold } from '../hooks/useHousehold';
import { supabase } from '../lib/supabase';
import { theme } from '../utils/theme';

export function HouseholdSetupScreen() {
  const { createHousehold, joinHousehold } = useHousehold();
  const [displayName, setDisplayName] = useState('');
  const [homeName, setHomeName] = useState('Dulce Hogar');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function wrap(fn: () => Promise<void>) {
    if (!displayName.trim()) return Alert.alert('Falta tu nombre', '¿Cómo te llama tu pareja?');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Ups', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Armemos su hogar 🏡</Text>
        <TextField placeholder="Tu nombre" value={displayName} onChangeText={setDisplayName} />

        <Card title="Crear un hogar nuevo">
          <TextField placeholder="Nombre del hogar" value={homeName} onChangeText={setHomeName} />
          <Button title="Crear hogar" loading={busy} onPress={() => wrap(() => createHousehold(homeName, displayName.trim()))} />
        </Card>

        <Card title="Unirme con un código">
          <TextField placeholder="Código de invitación" autoCapitalize="characters" value={code} onChangeText={setCode} />
          <Button title="Unirme" variant="secondary" disabled={busy || !code} onPress={() => wrap(() => joinHousehold(code, displayName.trim()))} />
        </Card>

        <Button title="Cerrar sesión" variant="secondary" onPress={() => supabase.auth.signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
});
