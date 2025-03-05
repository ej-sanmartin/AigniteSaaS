import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function LoadingAuth() {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner className="h-8 w-8 border-2 text-blue-600 dark:text-blue-500" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Verifying authentication...
        </p>
      </div>
    </div>
  );
} 