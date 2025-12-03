'use client';

import { useState, useEffect } from 'react';
import { ApiStatusResponse } from '@/types';

export function StatusBar() {
  const [status, setStatus] = useState<ApiStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('Failed to fetch status');
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError('API durumu alınamadı');
        console.error('Status fetch error:', err);
      }
    };

    fetchStatus();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  // Format the end date
  const formatEndDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate percentage
  const getUsagePercentage = (): string => {
    if (!status?.requests) return '0';
    return ((status.requests.current / status.requests.limit_day) * 100).toFixed(1);
  };

  // Get color based on usage
  const getUsageColor = () => {
    const percentage = parseFloat(getUsagePercentage());
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-slate-900/95 border-b border-white/5 py-1 px-4 text-xs relative">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 text-gray-400">
          {error ? (
            <span className="text-red-400">{error}</span>
          ) : status ? (
            <>
              <span className="hidden sm:inline">
                <span className="text-gray-500">Plan:</span>{' '}
                <span className="text-fb-yellow font-medium">{status.subscription?.plan || 'N/A'}</span>
              </span>
              <span className="hidden md:inline">
                <span className="text-gray-500">Bitiş:</span>{' '}
                <span className="text-gray-300">{status.subscription?.end ? formatEndDate(status.subscription.end) : 'N/A'}</span>
              </span>
              <span>
                <span className="text-gray-500">API:</span>{' '}
                <span className={getUsageColor()}>
                  {status.requests?.current?.toLocaleString('tr-TR') || 0}
                </span>
                <span className="text-gray-500">/</span>
                <span className="text-gray-400">
                  {status.requests?.limit_day?.toLocaleString('tr-TR') || 0}
                </span>
                <span className="text-gray-500 ml-1">
                  ({getUsagePercentage()}%)
                </span>
              </span>
            </>
          ) : (
            <span className="text-gray-500 animate-pulse">Yükleniyor...</span>
          )}
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-300 transition-colors p-0.5"
          aria-label="Kapat"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default StatusBar;
