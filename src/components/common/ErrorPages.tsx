export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center">
        <p className="text-8xl font-black text-surface-200">404</p>
        <h1 className="text-2xl font-bold text-surface-900 mt-4">Page Not Found</h1>
        <p className="text-surface-500 mt-2">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-6 inline-block text-brand-600 hover:underline font-medium">
          Go to Home
        </a>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center">
        <p className="text-8xl font-black text-surface-200">403</p>
        <h1 className="text-2xl font-bold text-surface-900 mt-4">Access Denied</h1>
        <p className="text-surface-500 mt-2">You don't have permission to access this page.</p>
        <a href="/" className="mt-6 inline-block text-brand-600 hover:underline font-medium">
          Back to Home
        </a>
      </div>
    </div>
  );
}
