import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface NativeCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'subtle' | 'bordered';
}

export function NativeCard({ children, style, variant = 'default' }: NativeCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'subtle':
        return theme.subtle;
      case 'bordered':
        return 'transparent';
      case 'default':
      default:
        return theme.card;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: theme.cardBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
  },
});
