import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { theme } from '../../utils/theme';

type Props = PressableProps & { title: string; variant?: 'primary' | 'secondary'; loading?: boolean };

export function Button({ title, variant = 'primary', loading, disabled, style, ...rest }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        { backgroundColor: primary ? theme.colors.primary : theme.colors.surface, opacity: disabled ? 0.5 : state.pressed ? 0.8 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={primary ? '#fff' : theme.colors.primary} />
      ) : (
        <Text style={[styles.text, { color: primary ? '#fff' : theme.colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary },
  text: { fontSize: 16, fontWeight: '600' },
});
