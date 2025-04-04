import { LoadingSpinner } from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
  className?: string;
  spinnerProps?: {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
  };
}

export function LoadingState({ 
  message = 'Loading...',
  fullPage = false,
  className = '',
  spinnerProps = {}
}: LoadingStateProps) {
  const containerClasses = fullPage 
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <LoadingSpinner 
          size={spinnerProps.size || 'lg'}
          color={spinnerProps.color || 'blue-600'}
          className="mb-4"
        />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
} 