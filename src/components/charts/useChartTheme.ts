import { useThemeStore } from '@/store/themeStore';

/**
 * Recharts draws with SVG attributes, which cannot read the app's CSS variables reliably,
 * so the neutral chart colours (grid, axes, tooltips) are chosen here per theme.
 * Series colours (green / red / amber / blue…) are the same in both themes.
 */
export function useChartTheme() {
  const dark = useThemeStore((s) => s.theme === 'dark');
  return dark
    ? {
        grid: '#22304a',
        axis: '#7c8aa5',
        muted: '#97a4bc',
        tooltipBg: '#111a2e',
        tooltipBorder: '#22304a',
        cursorLine: '#334463',
        cursorFill: '#172238',
        dotFill: '#111a2e',
      }
    : {
        grid: '#f1f5f9',
        axis: '#94a3b8',
        muted: '#64748b',
        tooltipBg: '#ffffff',
        tooltipBorder: '#e2e8f0',
        cursorLine: '#e2e8f0',
        cursorFill: '#f8fafc',
        dotFill: '#ffffff',
      };
}
