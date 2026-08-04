export const themes = {
  dark: {
    colorScheme: 'dark',
    bgDeep: '#0a0a0c',
    bgElevated: 'rgba(255,255,255,0.06)',
    bgElevatedHover: 'rgba(255,255,255,0.1)',
    border: 'rgba(255,255,255,0.09)',
    textPrimary: '#f5f5f7',
    textMuted: '#9a9aa2',
  },
  light: {
    colorScheme: 'light',
    bgDeep: '#faf7f2',
    bgElevated: '#ffffff',
    bgElevatedHover: '#f3efe8',
    border: 'rgba(0,0,0,0.08)',
    textPrimary: '#2b2620',
    textMuted: '#8a8074',
  },
};

export function resolveTheme(business) {
  return themes[business.theme] || themes.dark;
}
