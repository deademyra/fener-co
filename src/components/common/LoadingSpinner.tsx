import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-700 border-t-fb-yellow',
          sizeClasses[size]
        )}
      />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
      </div>
      <div className="flex items-center justify-center gap-8 py-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="skeleton h-6 w-20 rounded" />
        </div>
        <div className="skeleton h-10 w-16 rounded" />
        <div className="flex items-center gap-3">
          <div className="skeleton h-6 w-20 rounded" />
          <div className="skeleton w-12 h-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-400">Yükleniyor...</p>
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="skeleton h-10 w-full rounded mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full rounded mb-1" />
      ))}
    </div>
  );
}

export default LoadingSpinner;
