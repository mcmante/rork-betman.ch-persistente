import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useApp } from '@/contexts/AppContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const { theme } = useApp();

  const getBackgroundColor = () => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case 'primary': return theme.primary;
      case 'secondary': return theme.secondary;
      case 'outline': return 'transparent';
      case 'danger': return theme.error;
      default: return theme.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return disabled ? theme.textMuted : theme.primary;
    return '#FFFFFF';
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'medium': return { paddingVertical: 12, paddingHorizontal: 24 };
      case 'large': return { paddingVertical: 16, paddingHorizontal: 32 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'medium': return 16;
      case 'large': return 18;
    }
  };

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? theme.primary : 'transparent',
          borderWidth: variant === 'outline' ? 2 : 0,
          ...getPadding(),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: getFontSize() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontWeight: '600' as const,
  },
});
