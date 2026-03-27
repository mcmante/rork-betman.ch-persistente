import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const LOGO_URL = 'https://betman.ch/images/betmanlogo.png';

export const Logo: React.FC<LogoProps> = ({ size = 'medium', style }) => {
  const getSize = () => {
    switch (size) {
      case 'small': return { width: 80, height: 32 };
      case 'medium': return { width: 160, height: 64 };
      case 'large': return { width: 240, height: 96 };
    }
  };

  const dimensions = getSize();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: LOGO_URL }}
        style={[styles.logo, dimensions]}
        contentFit="contain"
        transition={300}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    backgroundColor: 'transparent',
  },
});
