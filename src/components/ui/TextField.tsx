import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { theme } from '../../utils/theme';

export function TextField(props: TextInputProps) {
  return <TextInput placeholderTextColor={theme.colors.muted} {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
});
