import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, KeyboardTypeOptions } from 'react-native';
import { useApp } from '@/contexts/AppContext';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  disabled = false,
  style,
  multiline = false,
  numberOfLines = 1,
  testID,
}) => {
  const { theme } = useApp();

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      )}
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={!disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            color: theme.text,
            borderColor: error ? theme.error : theme.border,
          },
          multiline && { height: numberOfLines * 24 + 24, textAlignVertical: 'top' as const },
          disabled && { opacity: 0.6 },
        ]}
      />
      {error && (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 52,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
