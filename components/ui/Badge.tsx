import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useApp } from '@/contexts/AppContext';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gold' | 'silver' | 'bronze';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'small',
  style,
}) => {
  const { theme } = useApp();

  const getColors = () => {
    switch (variant) {
      case 'primary': return { bg: theme.primaryLight + '20', text: theme.primary };
      case 'secondary': return { bg: theme.secondary + '20', text: theme.secondary };
      case 'success': return { bg: theme.success + '20', text: theme.success };
      case 'warning': return { bg: theme.warning + '20', text: theme.warning };
      case 'error': return { bg: theme.error + '20', text: theme.error };
      case 'gold': return { bg: theme.gold + '30', text: '#B8860B' };
      case 'silver': return { bg: theme.silver + '40', text: '#666666' };
      case 'bronze': return { bg: theme.bronze + '30', text: '#8B4513' };
      default: return { bg: theme.primaryLight + '20', text: theme.primary };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: size === 'small' ? 8 : 12,
          paddingVertical: size === 'small' ? 4 : 6,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: size === 'small' ? 11 : 13,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600' as const,
    textTransform: 'uppercase',
  },
});
