export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  appName: (import.meta.env.VITE_APP_NAME as string) || 'AttendanceIQ',
  appVersion: (import.meta.env.VITE_APP_VERSION as string) || '1.0.0',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
} as const;
