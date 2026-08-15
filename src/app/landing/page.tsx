'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Wallet,
  Palmtree,
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Shirt,
  Milk,
  Newspaper,
  Check,
  ChevronDown,
  ChevronUp,
  Calculator,
  UserCheck,
  UserX,
  Lock,
  LogOut,
  LayoutDashboard,
  Star,
  Zap,
  HelpCircle,
} from 'lucide-react';

export default function LandingPage() {
  const { user, signOut, signInWithEmail, signUpWithEmail } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Interactive Live Calculator Demo State
  const [calcRole, setCalcRole] = useState<'salary' | 'consumption' | 'daily_rate' | 'per_unit_log'>('salary');
  const [calcMonthlySalary, setCalcMonthlySalary] = useState(9000);
  const [calcDaysInMonth, setCalcDaysInMonth] = useState(30);
  const [calcAbsentDays, setCalcAbsentDays] = useState(2);
  const [calcLitresPerDay, setCalcLitresPerDay] = useState(1.5);
  const [calcCostPerLitre, setCalcCostPerLitre] = useState(70);
  const [calcDailyRate, setCalcDailyRate] = useState(25);
  const [calcIroningUnits, setCalcIroningUnits] = useState(35);
  const [calcCostPerUnit, setCalcCostPerUnit] = useState(12);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Handle Demo One-Click Access directly from Landing Page
  const handleDemoAccess = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      const { error } = await signInWithEmail('test@gharsaathi.com', 'Password123!');
      if (error) {
        await signUpWithEmail('test@gharsaathi.com', 'Password123!');
      }
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  // Calculate output for live demo widget
  const calculateDemoTotal = () => {
    if (calcRole === 'salary') {
      const perDay = calcMonthlySalary / (calcDaysInMonth || 30);
      const deduction = Math.round(perDay * calcAbsentDays);
      const payable = Math.max(0, calcMonthlySalary - deduction);
      return { payable, deduction, perDay: Math.round(perDay) };
    } else if (calcRole === 'consumption') {
      const activeDays = Math.max(0, calcDaysInMonth - calcAbsentDays);
      const totalLitres = activeDays * calcLitresPerDay;
      const payable = Math.round(totalLitres * calcCostPerLitre);
      return { payable, totalLitres: totalLitres.toFixed(1), activeDays };
    } else if (calcRole === 'daily_rate') {
      const activeDays = Math.max(0, calcDaysInMonth - calcAbsentDays);
      const payable = Math.round(activeDays * calcDailyRate);
      return { payable, activeDays };
    } else {
      const payable = Math.round(calcIroningUnits * calcCostPerUnit);
      return { payable, units: calcIroningUnits };
    }
  };

  const demoResult = calculateDemoTotal();

  const faqs = [
    {
      q: 'Is GharSaathi free for Indian households?',
      a: 'Yes! GharSaathi is 100% free for individual household managers. You can track unlimited staff members, attendance exceptions, and monthly payouts.',
    },
    {
      q: 'How are salary deductions calculated for absent days?',
      a: 'For fixed-salary staff (cooks/maids), GharSaathi calculates the daily rate (Monthly Salary ÷ Total Days in Month) and automatically deducts absent days to provide an exact, indisputable payable total.',
    },
    {
      q: 'Can I track milk delivery per litre and daily newspaper skipping?',
      a: 'Absolutely! GharSaathi features dedicated billing models for Milkmen (litres per day × cost per litre) and Newspaper Vendors (daily rate, skipping absent days).',
    },
    {
      q: 'What happens when our family goes on holiday or vacation?',
      a: 'You can enable Vacation Mode with 1 click. You can choose to pause tracking or log specific absent days during vacations, ensuring your billing stays completely accurate.',
    },
    {
      q: 'Do I need to download an app from Google Play / App Store?',
      a: 'No download required! GharSaathi is a modern Progressive Web App (PWA). You can open it on any mobile browser or click "Add to Home Screen" for instant app access.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1A1C1B] selection:bg-[#183C32] selection:text-white font-sans">
      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#F9F9F7]/90 backdrop-blur-md border-b border-[#E2E3E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#183C32] text-[#DDEFE5] flex items-center justify-center shadow-stitch group-hover:bg-[#00261D] transition-all transform group-hover:scale-105">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl text-[#1A1C1B] tracking-tight block">GharSaathi</span>
              <span className="text-[10px] sm:text-xs text-[#717975] font-medium hidden sm:block">Household Ledger</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-[#52625A]">
            <a href="#features" className="hover:text-[#183C32] transition-colors">Features</a>
            <a href="#calculator" className="hover:text-[#183C32] transition-colors">Live Calculator</a>
            <a href="#roles" className="hover:text-[#183C32] transition-colors">Staff Roles</a>
            <a href="#testimonials" className="hover:text-[#183C32] transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-[#183C32] transition-colors">FAQ</a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center space-x-3">
            {mounted && user ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2.5 rounded-xl bg-[#183C32] hover:bg-[#00261D] text-white text-xs font-bold shadow-stitch flex items-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#DDEFE5]" />
                  <span>Go to App Dashboard</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-2 rounded-xl text-[#717975] hover:text-[#BA1A1A] hover:bg-[#FFDAD6]/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#52625A] hover:text-[#183C32] px-3.5 py-2 rounded-xl transition-colors hidden sm:block"
                >
                  Sign In
                </Link>
                <button
                  onClick={handleDemoAccess}
                  disabled={demoLoading}
                  className="text-xs font-semibold bg-[#DDEFE5] hover:bg-[#cbe6d7] text-[#183C32] px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{demoLoading ? 'Launching Demo...' : 'Demo Access'}</span>
                </button>
                <Link
                  href="/login?mode=signup"
                  className="text-xs font-semibold bg-[#183C32] hover:bg-[#00261D] text-white px-4 py-2.5 rounded-xl shadow-stitch transition-all flex items-center space-x-1.5 active:scale-[0.98]"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-8 max-w-6xl mx-auto text-center overflow-hidden">
        {/* Glow backdrop elements */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#DDEFE5]/50 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#DDEFE5] text-[#183C32] border border-[#183C32]/10 mb-6 shadow-sm animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#183C32]" />
          <span className="text-xs font-bold tracking-wide">10,000+ Indian Households Trust GharSaathi</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-[#1A1C1B] tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Manage your domestic help <span className="text-[#183C32] underline decoration-[#DDEFE5] underline-offset-8">like a pro.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-[#52625A] max-w-2xl mx-auto font-normal leading-relaxed">
          The fintech-inspired ledger for your maids, cooks, drivers, milkmen, and ironing staff. Track attendance, automate deductions, and settle payments effortlessly.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
          {mounted && user ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#183C32] hover:bg-[#00261D] text-white font-bold text-sm sm:text-base shadow-stitch-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <LayoutDashboard className="w-5 h-5 text-[#DDEFE5]" />
              <span>Open My Attendance App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login?mode=signup"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#183C32] hover:bg-[#00261D] text-white font-bold text-sm sm:text-base shadow-stitch-lg flex items-center justify-center space-x-2.5 transition-all active:scale-[0.98]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDemoAccess}
                disabled={demoLoading}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-[#EEEEEC] text-[#183C32] border border-[#E2E3E0] font-bold text-sm sm:text-base shadow-stitch flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#183C32]" />
                <span>{demoLoading ? 'Launching Demo...' : 'Try 1-Click Demo'}</span>
              </button>
            </>
          )}
        </div>

        {/* Feature Checkmarks under CTAs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#52625A]">
          <span className="flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-[#183C32]" />
            <span>No Credit Card Needed</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-[#183C32]" />
            <span>Auto Salary Deductions</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-[#183C32]" />
            <span>Vacation Mode Included</span>
          </span>
        </div>

        {/* Hero Fintech Visual Card / App Ledger Preview */}
        <div className="mt-12 sm:mt-16 max-w-2xl mx-auto text-left">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E3E0] shadow-stitch-lg space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E2E3E0] pb-5">
              <div>
                <span className="text-xs font-bold text-[#717975] uppercase tracking-wider block">
                  Total Monthly Household Ledger
                </span>
                <div className="text-3xl sm:text-4xl font-black text-[#183C32] mt-1 tracking-tight">
                  ₹18,750
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#DDEFE5] text-[#183C32] border border-[#183C32]/10 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Nov Payout</span>
                </span>
                <span className="text-[11px] text-[#717975] block mt-1">3 Staff Active</span>
              </div>
            </div>

            {/* Helper Staff Rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#414845] uppercase tracking-wider">
                <span>Staff Member Breakdown</span>
                <span className="text-[#183C32]">Auto-Calculated</span>
              </div>

              {/* Row 1 - Cook */}
              <div className="bg-[#F9F9F7] rounded-2xl p-4 border border-[#E2E3E0] flex items-center justify-between hover:border-[#183C32]/30 transition-colors">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#DDEFE5] text-[#183C32] font-bold flex items-center justify-center text-base">
                    L
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm sm:text-base text-[#1A1C1B]">Lakshmi</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEEEEC] text-[#52625A]">
                        Cook
                      </span>
                    </div>
                    <p className="text-xs text-[#717975] mt-0.5">26 Days Present • 4 Days Absent Deducted</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm sm:text-base text-[#1A1C1B]">₹8,500</div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DDEFE5] text-[#183C32]">
                    Ready to Pay
                  </span>
                </div>
              </div>

              {/* Row 2 - Driver */}
              <div className="bg-[#F9F9F7] rounded-2xl p-4 border border-[#E2E3E0] flex items-center justify-between hover:border-[#183C32]/30 transition-colors">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#92400E] font-bold flex items-center justify-center text-base">
                    R
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm sm:text-base text-[#1A1C1B]">Ramesh</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEEEEC] text-[#52625A]">
                        Driver
                      </span>
                    </div>
                    <p className="text-xs text-[#717975] mt-0.5">28 Days Present • 2 Days Overtime</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm sm:text-base text-[#1A1C1B]">₹10,250</div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">
                    Due Today
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Salary Calculator Section */}
      <section id="calculator" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-y border-[#E2E3E0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#DDEFE5] text-[#183C32] text-xs font-bold mb-3">
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive Calculation Playground</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1B] tracking-tight">
              Try the Calculation Engine Live
            </h2>
            <p className="text-sm sm:text-base text-[#52625A] mt-2">
              Select a staff role below to see how GharSaathi auto-calculates payable totals without any manual errors.
            </p>
          </div>

          {/* Role Tabs Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setCalcRole('salary')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                calcRole === 'salary'
                  ? 'bg-[#183C32] text-white shadow-stitch'
                  : 'bg-[#F9F9F7] text-[#52625A] border border-[#E2E3E0] hover:bg-[#EEEEEC]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Maid / Cook (Monthly Salary)</span>
            </button>

            <button
              onClick={() => setCalcRole('consumption')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                calcRole === 'consumption'
                  ? 'bg-[#183C32] text-white shadow-stitch'
                  : 'bg-[#F9F9F7] text-[#52625A] border border-[#E2E3E0] hover:bg-[#EEEEEC]'
              }`}
            >
              <Milk className="w-4 h-4" />
              <span>Milkman (Litres / Day)</span>
            </button>

            <button
              onClick={() => setCalcRole('daily_rate')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                calcRole === 'daily_rate'
                  ? 'bg-[#183C32] text-white shadow-stitch'
                  : 'bg-[#F9F9F7] text-[#52625A] border border-[#E2E3E0] hover:bg-[#EEEEEC]'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>Newspaper (Daily Rate)</span>
            </button>

            <button
              onClick={() => setCalcRole('per_unit_log')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                calcRole === 'per_unit_log'
                  ? 'bg-[#183C32] text-white shadow-stitch'
                  : 'bg-[#F9F9F7] text-[#52625A] border border-[#E2E3E0] hover:bg-[#EEEEEC]'
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>Ironing (Per Piece Log)</span>
            </button>
          </div>

          {/* Calculator Card */}
          <div className="bg-[#F9F9F7] rounded-3xl p-6 sm:p-10 border border-[#E2E3E0] shadow-stitch grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Controls */}
            <div className="space-y-5">
              {calcRole === 'salary' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-2">
                      Monthly Base Salary: <span className="text-[#183C32] text-sm">₹{calcMonthlySalary.toLocaleString('en-IN')}</span>
                    </label>
                    <input
                      type="range"
                      min="3000"
                      max="30000"
                      step="500"
                      value={calcMonthlySalary}
                      onChange={(e) => setCalcMonthlySalary(Number(e.target.value))}
                      className="w-full accent-[#183C32] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-2">
                      Absent Days: <span className="text-[#BA1A1A] text-sm">{calcAbsentDays} Days</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="1"
                      value={calcAbsentDays}
                      onChange={(e) => setCalcAbsentDays(Number(e.target.value))}
                      className="w-full accent-[#BA1A1A] cursor-pointer"
                    />
                  </div>
                </>
              )}

              {calcRole === 'consumption' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-2">
                      Litres Delivered Per Day: <span className="text-[#183C32] text-sm">{calcLitresPerDay} Litres</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.5"
                      value={calcLitresPerDay}
                      onChange={(e) => setCalcLitresPerDay(Number(e.target.value))}
                      className="w-full accent-[#183C32] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-2">
                      Cost Per Litre (₹): <span className="text-[#183C32] text-sm">₹{calcCostPerLitre}/L</span>
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="120"
                      step="5"
                      value={calcCostPerLitre}
                      onChange={(e) => setCalcCostPerLitre(Number(e.target.value))}
                      className="w-full accent-[#183C32] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-2">
                      Days Not Taken (Absent): <span className="text-[#BA1A1A] text-sm">{calcAbsentDays} Days</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="1"
                      value={calcAbsentDays}
                      onChange={(e) => setCalcAbsentDays(Number(e.target.value))}
                      className="w-full accent-[#BA1A1A] cursor-pointer"
                    />
                  </div>
                </>
              )}

              {calcRole === 'daily_rate' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-2">
                      Cost Per Day (₹): <span className="text-[#183C32] text-sm">₹{calcDailyRate}/day</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={calcDailyRate}
                      onChange={(e) => setCalcDailyRate(Number(e.target.value))}
                      className="w-full accent-[#183C32] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-2">
                      Days Newspaper Skipped: <span className="text-[#BA1A1A] text-sm">{calcAbsentDays} Days</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="1"
                      value={calcAbsentDays}
                      onChange={(e) => setCalcAbsentDays(Number(e.target.value))}
                      className="w-full accent-[#BA1A1A] cursor-pointer"
                    />
                  </div>
                </>
              )}

              {calcRole === 'per_unit_log' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-2">
                      Total Clothes Ironed This Month: <span className="text-[#183C32] text-sm">{calcIroningUnits} Pieces</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={calcIroningUnits}
                      onChange={(e) => setCalcIroningUnits(Number(e.target.value))}
                      className="w-full accent-[#183C32] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-2">
                      Cost Per Piece (₹): <span className="text-[#183C32] text-sm">₹{calcCostPerUnit}/pc</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={calcCostPerUnit}
                      onChange={(e) => setCalcCostPerUnit(Number(e.target.value))}
                      className="w-full accent-[#183C32] cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right Output Display Box */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E3E0] shadow-stitch text-center space-y-4">
              <span className="text-xs font-bold text-[#717975] uppercase tracking-wider block">
                Calculated Net Payable
              </span>
              <div className="text-4xl sm:text-5xl font-black text-[#183C32] tracking-tight">
                ₹{demoResult.payable.toLocaleString('en-IN')}
              </div>

              {calcRole === 'salary' && (
                <div className="p-3 rounded-xl bg-[#FFF5F5] text-[#BA1A1A] text-xs font-semibold border border-[#BA1A1A]/10">
                  Absent Deduction ({calcAbsentDays} days @ ₹{demoResult.perDay}/day): -₹{demoResult.deduction?.toLocaleString('en-IN')}
                </div>
              )}

              {calcRole === 'consumption' && (
                <div className="p-3 rounded-xl bg-[#DDEFE5] text-[#183C32] text-xs font-semibold border border-[#183C32]/10">
                  Total Delivered: {demoResult.totalLitres} Litres ({demoResult.activeDays} days)
                </div>
              )}

              {calcRole === 'daily_rate' && (
                <div className="p-3 rounded-xl bg-[#DDEFE5] text-[#183C32] text-xs font-semibold border border-[#183C32]/10">
                  Newspaper Delivered: {demoResult.activeDays} Days (₹{calcDailyRate}/day)
                </div>
              )}

              {calcRole === 'per_unit_log' && (
                <div className="p-3 rounded-xl bg-[#DDEFE5] text-[#183C32] text-xs font-semibold border border-[#183C32]/10">
                  Service Logs Total: {demoResult.units} Clothes @ ₹{calcCostPerUnit}/pc
                </div>
              )}

              <p className="text-[11px] text-[#717975] pt-1">
                ⚡ Auto-updates live as you record daily attendance or service entries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1B] tracking-tight">
            Built for modern Indian homes.
          </h2>
          <p className="text-sm sm:text-base text-[#52625A] mt-2">
            Eliminate awkward monthly salary disputes and paper notebooks with transparent digital records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-8 border border-[#E2E3E0] shadow-stitch flex flex-col justify-between hover:border-[#183C32]/40 transition-colors">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1C1B] mb-2">1-Tap Attendance</h3>
              <p className="text-xs sm:text-sm text-[#52625A] leading-relaxed">
                Mark staff present or absent with a single tap. Attendance defaults to present, saving you time every morning.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E2E3E0] flex items-center text-xs font-bold text-[#183C32]">
              <span>Instant Daily Check-ins</span>
              <Check className="w-4 h-4 ml-auto" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-8 border border-[#E2E3E0] shadow-stitch flex flex-col justify-between hover:border-[#183C32]/40 transition-colors">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1C1B] mb-2">Role-Specific Math</h3>
              <p className="text-xs sm:text-sm text-[#52625A] leading-relaxed">
                Different roles use different billing types—from fixed cook salaries to per-litre milk logs and daily newspaper rates.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E2E3E0] flex items-center text-xs font-bold text-[#183C32]">
              <span>Zero Calculation Errors</span>
              <Check className="w-4 h-4 ml-auto" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-8 border border-[#E2E3E0] shadow-stitch flex flex-col justify-between hover:border-[#183C32]/40 transition-colors">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center mb-6">
                <Palmtree className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1C1B] mb-2">Vacation & Holiday Mode</h3>
              <p className="text-xs sm:text-sm text-[#52625A] leading-relaxed">
                Going out of town? Activate Vacation Mode to pause tracking while maintaining full deduction transparency.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E2E3E0] flex items-center text-xs font-bold text-[#183C32]">
              <span>1-Click Household Pause</span>
              <Check className="w-4 h-4 ml-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Staff Roles Showcase */}
      <section id="roles" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-y border-[#E2E3E0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1B]">
              4 Custom Billing Models
            </h2>
            <p className="text-xs sm:text-sm text-[#52625A] mt-2">
              Every staff member is unique. We support all common household billing types.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#F9F9F7] p-6 rounded-3xl border border-[#E2E3E0] shadow-stitch text-center hover:border-[#183C32]/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#1A1C1B]">Cooks & Maids</h4>
              <p className="text-xs text-[#717975] mt-1">Monthly Salary + Absent Deductions</p>
            </div>

            <div className="bg-[#F9F9F7] p-6 rounded-3xl border border-[#E2E3E0] shadow-stitch text-center hover:border-[#183C32]/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center mx-auto mb-4">
                <Milk className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#1A1C1B]">Milkmen</h4>
              <p className="text-xs text-[#717975] mt-1">Litres Per Day × Cost Per Litre</p>
            </div>

            <div className="bg-[#F9F9F7] p-6 rounded-3xl border border-[#E2E3E0] shadow-stitch text-center hover:border-[#183C32]/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center mx-auto mb-4">
                <Newspaper className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#1A1C1B]">Newspaper Vendors</h4>
              <p className="text-xs text-[#717975] mt-1">Daily Rate × Present Days</p>
            </div>

            <div className="bg-[#F9F9F7] p-6 rounded-3xl border border-[#E2E3E0] shadow-stitch text-center hover:border-[#183C32]/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center mx-auto mb-4">
                <Shirt className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#1A1C1B]">Ironing Services</h4>
              <p className="text-xs text-[#717975] mt-1">Per-Piece Service Unit Logs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center space-x-1 text-[#F59E0B] mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1B]">
            Loved by 10,000+ Indian Homes
          </h2>
          <p className="text-sm text-[#52625A] mt-2">
            Here is what household managers across Bangalore, Mumbai, Gurgaon, and Delhi say about GharSaathi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-[#E2E3E0] shadow-stitch flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-[#52625A] leading-relaxed italic">
              "We used to write dates on a kitchen calendar that would always get lost. With GharSaathi, our cook's salary calculation takes 5 seconds on the 1st of every month."
            </p>
            <div className="mt-6 pt-4 border-t border-[#E2E3E0] flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#DDEFE5] text-[#183C32] font-bold flex items-center justify-center text-xs">
                AR
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#1A1C1B]">Ananya Rao</h5>
                <span className="text-[11px] text-[#717975]">Bangalore • Managing 4 Staff</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E2E3E0] shadow-stitch flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-[#52625A] leading-relaxed italic">
              "Tracking milk litres and newspaper skips used to be a mess. GharSaathi's custom billing types for milkmen and newspaper vendors solved it completely!"
            </p>
            <div className="mt-6 pt-4 border-t border-[#E2E3E0] flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#DDEFE5] text-[#183C32] font-bold flex items-center justify-center text-xs">
                VK
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#1A1C1B]">Vikram Kapoor</h5>
                <span className="text-[11px] text-[#717975]">Gurgaon • Managing 3 Staff</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E2E3E0] shadow-stitch flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-[#52625A] leading-relaxed italic">
              "Vacation Mode is a lifesaver! When we went to Goa for 10 days, we set vacation mode and the app handled deductions accurately."
            </p>
            <div className="mt-6 pt-4 border-t border-[#E2E3E0] flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#DDEFE5] text-[#183C32] font-bold flex items-center justify-center text-xs">
                PM
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#1A1C1B]">Priya Mehta</h5>
                <span className="text-[11px] text-[#717975]">Mumbai • Managing 5 Staff</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-y border-[#E2E3E0]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1B]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#52625A] mt-2">
              Everything you need to know about setting up and using GharSaathi.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#F9F9F7] rounded-2xl border border-[#E2E3E0] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm sm:text-base text-[#1A1C1B] flex items-center justify-between space-x-4"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-[#183C32] shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#717975] shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#52625A] leading-relaxed border-t border-[#E2E3E0]/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="bg-[#183C32] text-white rounded-3xl p-8 sm:p-16 text-center shadow-stitch-lg relative overflow-hidden space-y-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#DDEFE5]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
              Ready to simplify your household ledger?
            </h2>
            <p className="text-sm sm:text-base text-[#DDEFE5] max-w-xl mx-auto font-normal">
              Join thousands of households managing their domestic help effortlessly with complete peace of mind.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {mounted && user ? (
                <Link
                  href="/dashboard"
                  className="px-8 py-4 rounded-2xl bg-white text-[#183C32] hover:bg-[#DDEFE5] font-bold text-sm sm:text-base shadow-lg transition-all active:scale-[0.98] flex items-center space-x-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Go to App Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login?mode=signup"
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-[#183C32] hover:bg-[#DDEFE5] font-bold text-sm sm:text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleDemoAccess}
                    disabled={demoLoading}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#00261D] text-white hover:bg-[#183C32] border border-[#DDEFE5]/30 font-bold text-sm sm:text-base shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-[#DDEFE5]" />
                    <span>{demoLoading ? 'Launching Demo...' : '1-Click Demo'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E3E0] py-10 text-center text-xs text-[#717975] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#183C32] text-white flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-[#DDEFE5]" />
            </div>
            <span className="font-bold text-[#1A1C1B]">GharSaathi</span>
            <span suppressHydrationWarning>© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6 font-semibold text-[#52625A]">
            <Link href="/login" className="hover:text-[#183C32] transition-colors">
              Sign In
            </Link>
            <Link href="/login?mode=signup" className="hover:text-[#183C32] transition-colors">
              Create Account
            </Link>
            <Link href="/dashboard" className="hover:text-[#183C32] transition-colors">
              App Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
