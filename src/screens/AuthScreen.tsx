import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DulceHogarLogo } from '../components/DulceHogarLogo';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { supabase } from '../lib/supabase';
import { LOGO_VISUALS } from '../utils/logoState';
import { theme } from '../utils/theme';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function run(mode: 'signIn' | 'signUp') {
    setLoading(true);
    const { error } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert('Ups', error.message);
    else if (mode === 'signUp') Alert.alert('¡Listo!', 'Revisá tu correo para confirmar la cuenta.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <DulceHogarLogo visual={LOGO_VISUALS.hogar_completo} size={120} showLabel={false} />
        <Text style={styles.title}>Dulce Hogar</Text>
        <View style={styles.form}>
          <TextField placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextField placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
          <Button title="Entrar" loading={loading} onPress={() => run('signIn')} />
          <Button title="Crear cuenta" variant="secondary" disabled={loading} onPress={() => run('signUp')} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.text },
  form: { width: '100%', gap: 12 },
});
