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
        grid: '#1c2334',
        axis: '#707c94',
        muted: '#8c98af',
        tooltipBg: '#0b0f19',
        tooltipBorder: '#1c2334',
        cursorLine: '#2a344a',
        cursorFill: '#111623',
        dotFill: '#0b0f19',
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
