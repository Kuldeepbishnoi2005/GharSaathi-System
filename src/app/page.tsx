'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw } from 'lucide-react';
import LandingPage from '@/app/landing/page';
import DashboardPage from '@/app/dashboard/page';

export default function RootPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex flex-col items-[#717975] items-center justify-center min-h-screen bg-[#F9F9F7]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#183C32] mb-2" />
        <p className="text-sm font-medium">Loading GharSaathi...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <DashboardPage />;
}
