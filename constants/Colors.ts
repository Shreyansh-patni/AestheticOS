export const Colors = {
  light: {
    base: '#FFFFFF',
    card: '#FAFAFA',
    cardBorder: '#E5E5E5',
    subtle: '#F5F5F5',
    border: '#E5E5E5',
    borderStrong: '#D4D4D4',
    text: '#0A0A0A',
    textSecondary: '#525252',
    textMuted: '#737373',
    tint: '#0A0A0A',
    accent: '#10B981', // Emerald for completions
    accentSubtle: 'rgba(16, 185, 129, 0.12)',
    warning: '#F59E0B',
    danger: '#EF4444',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E5E5',
    tabIconDefault: '#737373',
    tabIconSelected: '#0A0A0A',
  },
  dark: {
    base: '#000000',
    card: '#0A0A0A',
    cardBorder: '#262626',
    subtle: '#171717',
    border: '#262626',
    borderStrong: '#373737',
    text: '#FAFAFA',
    textSecondary: '#D4D4D4',
    textMuted: '#8A8A8A',
    tint: '#FAFAFA',
    accent: '#10B981', // Emerald for completions
    accentSubtle: 'rgba(16, 185, 129, 0.16)',
    warning: '#F59E0B',
    danger: '#EF4444',
    tabBarBackground: '#000000',
    tabBarBorder: '#171717',
    tabIconDefault: '#525252',
    tabIconSelected: '#FAFAFA',
  },
};

export type ThemeColors = typeof Colors.dark;
export default Colors;
