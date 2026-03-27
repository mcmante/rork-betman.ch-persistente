import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useApp } from '@/contexts/AppContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevated = false,
  testID,
}) => {
  const { theme, isDark } = useApp();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: elevated ? theme.surfaceElevated : theme.cardBackground,
      borderColor: theme.border,
      shadowColor: isDark ? '#000' : '#64748B',
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.7}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
