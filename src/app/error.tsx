'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the full error to an error reporting service or console server-side
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-stitch border border-[#E2E3E0] text-center space-y-4">
        <div className="w-14 h-14 bg-[#FFDAD6] text-[#93000A] rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#1A1C1B]">Something went wrong</h2>
          <p className="text-xs text-[#717975] mt-1 leading-relaxed">
            We encountered an unexpected error. No sensitive information was compromised.
            Please try refreshing the page.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 rounded-xl bg-[#183C32] hover:bg-[#00261D] text-white font-semibold text-sm shadow-stitch flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
