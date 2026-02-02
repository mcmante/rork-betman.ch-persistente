import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface TeamFlagProps {
  url: string;
  size?: number;
  style?: ViewStyle;
}

export const TeamFlag: React.FC<TeamFlagProps> = ({
  url,
  size = 32,
  style,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size * 0.67 }, style]}>
      <Image
        source={{ uri: url }}
        style={styles.flag}
        contentFit="cover"
        transition={200}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  flag: {
    width: '100%',
    height: '100%',
  },
});
