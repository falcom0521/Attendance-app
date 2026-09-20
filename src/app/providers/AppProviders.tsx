import { QueryProvider } from './QueryProvider';
import { ToastProvider } from '@/components/feedback/Toast';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryProvider>
  );
}
