import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProviders } from './providers/AppProviders';
import { router } from './router';
import { useAuthStore } from '@/store/authStore';

function AppInner() {
  const { hydrateFromStorage } = useAuthStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <AppProviders>
      <AppInner />
    </AppProviders>
  );
}
