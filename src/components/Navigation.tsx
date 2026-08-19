'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  Users,
  CalendarCheck,
  Wallet,
  LogOut,
  Bell,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user || pathname === '/login' || pathname === '/landing') {
    return null;
  }

  // Greeting based on time of day
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const userName = user.email ? user.email.split('@')[0] : 'User';
  const initial = userName.charAt(0).toUpperCase();

  // Page title mapping for mobile top bar
  const getPageTitle = () => {
    if (pathname === '/dashboard' || pathname === '/') return 'Home Overview';
    if (pathname === '/helpers') return 'My Helpers';
    if (pathname.startsWith('/helpers/')) return 'Helper Details';
    if (pathname === '/history') return 'Attendance Ledger';
    if (pathname === '/payments') return 'Payout Ledger';
    return 'GharSaathi';
  };

  const isDetailPage = pathname.startsWith('/helpers/');

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'Helpers', href: '/helpers', icon: Users },
    { label: 'Attendance', href: '/history', icon: CalendarCheck },
    { label: 'Payments', href: '/payments', icon: Wallet },
  ];

  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 bg-[#F9F9F7]/90 backdrop-blur-xl border-b border-[#E2E3E0] px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isDetailPage ? (
              <Link
                href="/helpers"
                className="p-2 rounded-2xl bg-white border border-[#E2E3E0] text-[#183C32] hover:bg-[#DDEFE5] transition-all active:scale-95 shadow-sm flex items-center justify-center"
                title="Back to Helpers"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            ) : (
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-forest text-[#DDEFE5] flex items-center justify-center font-black text-sm shadow-md border border-[#183C32]/20">
                  {initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#F9F9F7]" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-1.5">
                <p className="text-[11px] font-semibold text-[#717975] uppercase tracking-wider leading-none">
                  {greeting}
                </p>
                <span className="w-1 h-1 rounded-full bg-[#183C32]/40" />
                <span className="text-[11px] font-bold text-[#183C32] capitalize leading-none">{userName}</span>
              </div>
              <h1 className="font-black text-[#1A1C1B] text-lg tracking-tight leading-tight mt-0.5">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => alert('All household data is up to date')}
              className="p-2.5 rounded-2xl text-[#52625A] hover:bg-[#EEEEEC] transition-all active:scale-95 relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#183C32] animate-pulse-dot" />
            </button>

            <button
              type="button"
              onClick={() => signOut()}
              title="Sign Out"
              className="p-2.5 rounded-2xl text-[#717975] hover:text-[#BA1A1A] hover:bg-[#FFDAD6]/40 transition-all active:scale-95"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Glass Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-auto w-full max-w-md z-40 glass-nav border-t border-[#E2E3E0]/80 px-3 py-2 pb-5 sm:pb-3 shadow-stitch-lg">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname === '/'
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-[#183C32] font-black'
                    : 'text-[#717975] hover:text-[#1A1C1B]'
                }`}
              >
                <div
                  className={`p-2 rounded-2xl transition-all relative ${
                    isActive ? 'bg-[#183C32] text-[#DDEFE5] shadow-md shadow-[#183C32]/20' : 'bg-transparent text-[#717975]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-bold text-[#183C32]' : 'font-medium text-[#717975]'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

