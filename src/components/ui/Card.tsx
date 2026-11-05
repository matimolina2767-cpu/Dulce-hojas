import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { theme } from '../../utils/theme';

export function Card({ title, children, style, ...rest }: ViewProps & { title?: string }) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
});
