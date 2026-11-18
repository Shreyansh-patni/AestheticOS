import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { haptics } from '@/services/haptics';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  rightSecondaryAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export function HeaderBar({
  title,
  subtitle,
  showBack = false,
  rightAction,
  rightSecondaryAction,
}: HeaderBarProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              haptics.light();
              router.back();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
        )}
        <View>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle.toUpperCase()}</Text>
          ) : null}
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        {rightSecondaryAction && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.subtle }]}
            onPress={() => {
              haptics.light();
              rightSecondaryAction.onPress();
            }}
          >
            <Ionicons name={rightSecondaryAction.icon} size={20} color={theme.text} />
          </TouchableOpacity>
        )}

        {rightAction && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.subtle, marginLeft: 8 }]}
            onPress={() => {
              haptics.light();
              rightAction.onPress();
            }}
          >
            <Ionicons name={rightAction.icon} size={20} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
