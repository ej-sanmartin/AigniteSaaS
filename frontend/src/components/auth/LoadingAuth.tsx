import { LoadingState } from '@/components/ui/LoadingState';

export function LoadingAuth() {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingState 
        message="Verifying authentication..."
        fullPage={false}
        spinnerProps={{
          color: 'blue-600'
        }}
      />
    </div>
  );
} 