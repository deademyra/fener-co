'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="font-display text-2xl text-white mb-4">Bir Hata Oluştu</h2>
        <p className="text-gray-400 mb-8 max-w-md">
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <button
          onClick={() => reset()}
          className="btn btn-primary"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
