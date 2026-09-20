import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading data. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 p-4 bg-danger-50 rounded-2xl text-danger-500">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
