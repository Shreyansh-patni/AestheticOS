import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { haptics } from '@/services/haptics';

interface NativeButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function NativeButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  loading = false,
  disabled = false,
  icon,
}: NativeButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const handlePress = () => {
    if (disabled || loading) return;
    haptics.light();
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    let bg = theme.text;
    let border = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        bg = colorScheme === 'dark' ? '#FAFAFA' : '#171717';
        break;
      case 'secondary':
        bg = theme.subtle;
        border = theme.border;
        borderWidth = 1;
        break;
      case 'outline':
        bg = 'transparent';
        border = theme.borderStrong;
        borderWidth = 1;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
      case 'accent':
        bg = theme.accent;
        break;
      case 'danger':
        bg = theme.danger;
        break;
    }

    let paddingVertical = 12;
    let paddingHorizontal = 18;
    let borderRadius = 12;

    if (size === 'sm') {
      paddingVertical = 8;
      paddingHorizontal = 12;
      borderRadius = 8;
    } else if (size === 'lg') {
      paddingVertical = 16;
      paddingHorizontal = 24;
      borderRadius = 14;
    }

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth,
      paddingVertical,
      paddingHorizontal,
      borderRadius,
      opacity: disabled ? 0.45 : 1,
    };
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return colorScheme === 'dark' ? '#0A0A0A' : '#FAFAFA';
      case 'secondary':
      case 'outline':
      case 'ghost':
        return theme.text;
      case 'accent':
      case 'danger':
        return '#FFFFFF';
      default:
        return theme.text;
    }
  };

  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[styles.button, getContainerStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize,
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
