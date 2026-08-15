'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Worker, AttendanceException, VacationPeriod, ServiceLog } from '@/lib/types';
import { formatDateISO } from '@/lib/utils/calculations';
import { validateDateRange, validateNumericInput, validateNoteText } from '@/lib/utils/validation';
import { sanitizeErrorMessage } from '@/lib/utils/errorHandling';
import {
  CheckCircle2,
  XCircle,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Plus,
  RefreshCw,
  Palmtree,
  Shirt,
  X,
  Sparkles,
  TrendingDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [todayExceptions, setTodayExceptions] = useState<AttendanceException[]>([]);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [todayLogs, setTodayLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingWorkerId, setTogglingWorkerId] = useState<string | null>(null);

  // Vacation Modal State
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [vacationStartDate, setVacationStartDate] = useState(formatDateISO(new Date()));
  const [vacationEndDate, setVacationEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return formatDateISO(d);
  });
  const [vacationNote, setVacationNote] = useState('');
  const [isSubmittingVacation, setIsSubmittingVacation] = useState(false);

  // Quick Service Log Modal State (for Ironing / Unit-based roles)
  const [logModalWorker, setLogModalWorker] = useState<Worker | null>(null);
  const [logUnits, setLogUnits] = useState('');
  const [logNote, setLogNote] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const todayStr = formatDateISO(new Date());

  useEffect(() => {
    let isSubscribed = true;

    if (authLoading) return;

    if (!user) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    const supabase = createClient();

    async function loadTodayData() {
      try {
        setLoading(true);
        // Fetch active workers
        const { data: workersData, error: wErr } = await supabase
          .from('workers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (wErr) console.error('Workers error:', wErr);

        // Fetch today's exceptions
        const { data: exData, error: eErr } = await supabase
          .from('attendance_exceptions')
          .select('*')
          .eq('date', todayStr);

        if (eErr) console.error('Exceptions error:', eErr);

        // Fetch vacation periods
        const { data: vpData, error: vpErr } = await supabase.from('vacation_periods').select('*');

        if (vpErr) console.error('Vacation periods error:', vpErr);

        // Fetch today's service logs
        const { data: slData, error: slErr } = await supabase
          .from('service_logs')
          .select('*')
          .eq('date', todayStr);

        if (slErr) console.error('Service logs error:', slErr);

        if (isSubscribed) {
          setWorkers(workersData || []);
          setTodayExceptions(exData || []);
          setVacationPeriods(vpData || []);
          setTodayLogs(slData || []);
        }
      } catch (err) {
        console.error('Error fetching today attendance:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadTodayData();

    return () => {
      isSubscribed = false;
    };
  }, [user, authLoading, todayStr, router]);

  // Check if today is in an active vacation period
  const activeVacationToday = vacationPeriods.find(
    (vp) => todayStr >= vp.start_date && todayStr <= vp.end_date
  );

  // Toggle attendance for attendance-based roles
  const toggleAttendance = async (workerId: string) => {
    if (togglingWorkerId) return;
    setTogglingWorkerId(workerId);

    const supabase = createClient();
    const existingException = todayExceptions.find((ex) => ex.worker_id === workerId);

    if (existingException) {
      // Currently Absent -> Mark Present
      setTodayExceptions((prev) => prev.filter((ex) => ex.worker_id !== workerId));

      const { error } = await supabase
        .from('attendance_exceptions')
        .delete()
        .eq('id', existingException.id);

      if (error) {
        console.error('Failed to mark present:', error);
        setTodayExceptions((prev) => [...prev, existingException]);
      }
    } else {
      // Currently Present -> Mark Absent
      const tempId = `temp-${Date.now()}`;
      const newException: AttendanceException = {
        id: tempId,
        worker_id: workerId,
        date: todayStr,
        status: 'absent',
      };

      setTodayExceptions((prev) => [...prev, newException]);

      const { data, error } = await supabase
        .from('attendance_exceptions')
        .insert({
          worker_id: workerId,
          date: todayStr,
          status: 'absent',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to mark absent:', error);
        setTodayExceptions((prev) => prev.filter((ex) => ex.id !== tempId));
      } else if (data) {
        setTodayExceptions((prev) =>
          prev.map((ex) => (ex.id === tempId ? (data as AttendanceException) : ex))
        );
      }
    }

    setTogglingWorkerId(null);
  };

  // Create new vacation period
  const handleSaveVacation = async (e: React.FormEvent) => {
    e.preventDefault();

    const rangeVal = validateDateRange(vacationStartDate, vacationEndDate);
    if (!rangeVal.isValid) {
      alert(rangeVal.error || 'Invalid date range.');
      return;
    }

    const noteVal = validateNoteText(vacationNote, 250);
    if (!noteVal.isValid) {
      alert(noteVal.error || 'Invalid note.');
      return;
    }

    setIsSubmittingVacation(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('vacation_periods')
        .insert({
          user_id: user!.id,
          start_date: vacationStartDate,
          end_date: vacationEndDate,
          note: vacationNote.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setVacationPeriods((prev) => [...prev, data as VacationPeriod]);
      }

      setIsVacationModalOpen(false);
      setVacationNote('');
    } catch (err: any) {
      alert(sanitizeErrorMessage(err, 'Failed to save vacation period. Please try again.'));
    } finally {
      setIsSubmittingVacation(false);
    }
  };

  // End active vacation early
  const handleEndVacation = async (vpId: string) => {
    if (!confirm('End vacation mode now? Attendance tracking will resume.')) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.from('vacation_periods').delete().eq('id', vpId);
      if (error) throw error;
      setVacationPeriods((prev) => prev.filter((vp) => vp.id !== vpId));
    } catch (err: any) {
      alert(sanitizeErrorMessage(err, 'Failed to delete vacation period. Please try again.'));
    }
  };

  // Add Quick Service Log (for Unit-based worker)
  const handleAddQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logModalWorker) return;

    const unitVal = validateNumericInput(logUnits, { fieldName: 'Number of pieces/units', min: 1, max: 10000, allowZero: false, integerOnly: true });
    if (!unitVal.isValid) {
      alert(unitVal.error || 'Invalid number of pieces.');
      return;
    }

    const noteVal = validateNoteText(logNote, 250);
    if (!noteVal.isValid) {
      alert(noteVal.error || 'Invalid note.');
      return;
    }

    const unitsNum = Number(logUnits);
    const costPerUnit = Number(logModalWorker.cost_per_unit) || 0;
    const amountNum = Math.round(unitsNum * costPerUnit);

    setIsSubmittingLog(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('service_logs')
        .insert({
          worker_id: logModalWorker.id,
          date: todayStr,
          units: unitsNum,
          amount: amountNum,
          note: logNote.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTodayLogs((prev) => [data as ServiceLog, ...prev]);
      }

      setLogModalWorker(null);
      setLogUnits('');
      setLogNote('');
    } catch (err: any) {
      alert(sanitizeErrorMessage(err, 'Failed to save log entry. Please try again.'));
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const attendanceWorkers = workers.filter((w) => w.billing_type !== 'per_unit_log');
  const absentCount = todayExceptions.length;
  const presentCount = Math.max(0, attendanceWorkers.length - absentCount);

  // Compute estimated total monthly payout
  const totalEstimatedMonthlyPayout = workers.reduce((sum, w) => {
    if (w.billing_type === 'salary') return sum + (Number(w.monthly_salary) || 0);
    if (w.billing_type === 'daily_rate') return sum + (Number(w.daily_rate) || 0) * 30;
    if (w.billing_type === 'consumption') return sum + (Number(w.litres_per_day) || 0) * (Number(w.cost_per_litre) || 0) * 30;
    if (w.billing_type === 'per_unit_log') return sum + (Number(w.cost_per_unit) || 0) * 40;
    return sum;
  }, 0);

  const formattedHeaderDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#717975]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#183C32] mb-2" />
        <p className="text-sm font-medium">Loading household ledger...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-24 space-y-6">
      {/* 1. Ultra-Premium Fintech Wallet Card ("Household Ledger") */}
      <div className="bg-gradient-forest text-white rounded-3xl p-6 shadow-card-glow relative overflow-hidden space-y-4 border border-[#183C32]/40">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#DDEFE5]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#10B981]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#DDEFE5] text-[11px] font-extrabold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/15">
            <Calendar className="w-3.5 h-3.5 text-[#DDEFE5]" />
            <span>{formattedHeaderDate}</span>
          </div>

          <button
            onClick={() => setIsVacationModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center space-x-1.5 transition-all shadow-sm border border-white/20 shrink-0 active:scale-95"
          >
            <Palmtree className="w-3.5 h-3.5 text-[#DDEFE5]" />
            <span>Vacation Mode</span>
          </button>
        </div>

        <div className="relative z-10 pt-1">
          <span className="text-xs text-[#DDEFE5]/80 font-semibold tracking-wide">
            Total Monthly Household Ledger
          </span>
          <div className="text-4xl font-black tracking-tight text-white mt-1 flex items-baseline space-x-1">
            <span>₹{totalEstimatedMonthlyPayout.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-[#DDEFE5]/70 mt-1 font-medium flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#DDEFE5]" />
            <span>Auto-Calculated across {workers.length} active helpers</span>
          </p>
        </div>

        <div className="relative z-10 pt-3 flex items-center justify-between border-t border-white/15">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse-dot" />
            <span className="text-xs text-[#DDEFE5] font-bold">Ledger Active</span>
          </div>

          <Link
            href="/helpers"
            className="px-4 py-2 rounded-2xl bg-[#DDEFE5] text-[#183C32] hover:bg-white text-xs font-black transition-all shadow-md flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#183C32]" />
            <span>Add Staff</span>
          </Link>
        </div>
      </div>

      {/* ACTIVE VACATION MODE BANNER */}
      {activeVacationToday && (
        <div className="p-4 rounded-3xl bg-[#FEF3C7] border border-[#F59E0B]/40 shadow-stitch flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F59E0B]/25 text-[#92400E] flex items-center justify-center font-bold shrink-0">
              <Palmtree className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-[#92400E] text-sm">Vacation Mode Active</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/30 text-[#78350F]">
                  Paused
                </span>
              </div>
              <p className="text-xs text-[#78350F] mt-0.5 font-medium">
                Active until{' '}
                {new Date(activeVacationToday.end_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
                {activeVacationToday.note && ` ("${activeVacationToday.note}")`}.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleEndVacation(activeVacationToday.id)}
            className="px-3.5 py-2 rounded-2xl bg-[#78350F] text-white text-xs font-bold hover:bg-[#92400E] transition-all shrink-0 ml-2 active:scale-95"
          >
            End Early
          </button>
        </div>
      )}

      {/* 2. Quick Stats Horizontally Scrollable Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-[#717975] uppercase tracking-wider">
            Household Overview
          </h3>
          <span className="text-[11px] font-bold text-[#183C32]">Live Daily Feed</span>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-1">
          {/* Card 1: Active Helpers */}
          <div className="min-w-[135px] flex-1 bg-white rounded-3xl p-4 border border-[#E2E3E0] shadow-stitch flex flex-col justify-between hover:border-[#183C32]/30 transition-all">
            <div className="flex items-center justify-between text-[#717975] mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Staff</span>
              <div className="w-7 h-7 rounded-xl bg-[#F4F4F1] flex items-center justify-center">
                <Users className="w-4 h-4 text-[#183C32]" />
              </div>
            </div>
            <span className="text-2xl font-black text-[#1A1C1B]">{workers.length}</span>
          </div>

          {/* Card 2: Present Today */}
          <div className="min-w-[135px] flex-1 bg-[#DDEFE5]/60 rounded-3xl p-4 border border-[#183C32]/20 shadow-stitch flex flex-col justify-between hover:border-[#183C32]/40 transition-all">
            <div className="flex items-center justify-between text-[#183C32] mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Present</span>
              <div className="w-7 h-7 rounded-xl bg-[#183C32] text-[#DDEFE5] flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black text-[#183C32]">{presentCount}</span>
          </div>

          {/* Card 3: Absent Today */}
          <div className="min-w-[135px] flex-1 bg-[#FFDAD6]/50 rounded-3xl p-4 border border-[#BA1A1A]/20 shadow-stitch flex flex-col justify-between hover:border-[#BA1A1A]/40 transition-all">
            <div className="flex items-center justify-between text-[#BA1A1A] mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Absent</span>
              <div className="w-7 h-7 rounded-xl bg-[#BA1A1A] text-white flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black text-[#BA1A1A]">{absentCount}</span>
          </div>
        </div>
      </div>

      {/* 3. Today's Attendance Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#1A1C1B]">Today's Attendance</h2>
            <p className="text-[11px] text-[#717975] font-medium">Tap button to mark present or absent</p>
          </div>
          <Link
            href="/helpers"
            className="text-xs font-bold text-[#183C32] hover:underline flex items-center space-x-1"
          >
            <span>All Staff</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {workers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#E2E3E0] shadow-stitch text-center">
            <div className="w-14 h-14 rounded-3xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center mx-auto mb-3 shadow-emerald-glow">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-[#1A1C1B] text-base">No staff members added yet</h3>
            <p className="text-xs text-[#717975] mt-1 max-w-xs mx-auto font-medium">
              Add your cook, maid, milkman, driver, newspaper, or ironing staff to begin.
            </p>
            <Link
              href="/helpers"
              className="mt-4 inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-[#183C32] text-white text-xs font-bold shadow-stitch hover:bg-[#00261D] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Helper</span>
            </Link>
          </div>
        ) : (
          workers.map((worker) => {
            const roleName = worker.role === 'Other' ? worker.custom_role_name || 'Other' : worker.role;
            const bType = worker.billing_type || 'salary';
            const isUnitBased = bType === 'per_unit_log';

            const isAbsent = todayExceptions.some((ex) => ex.worker_id === worker.id);
            const isProcessing = togglingWorkerId === worker.id;

            // Compute today's unit log summary if ironing
            const workerTodayLogs = todayLogs.filter((l) => l.worker_id === worker.id);
            const todayUnitsCount = workerTodayLogs.reduce((sum, l) => sum + (Number(l.units) || 0), 0);

            return (
              <div
                key={worker.id}
                onClick={() => router.push(`/helpers/${worker.id}`)}
                className={`group cursor-pointer rounded-3xl p-4 border transition-all duration-200 shadow-stitch flex items-center justify-between active:scale-[0.98] ${
                  isAbsent
                    ? 'bg-[#FFF5F5] border-[#BA1A1A]/30 hover:border-[#BA1A1A]'
                    : 'bg-white border-[#E2E3E0] hover:border-[#183C32]/40'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base transition-colors shrink-0 shadow-sm ${
                      isAbsent
                        ? 'bg-[#FFDAD6] text-[#93000A]'
                        : 'bg-[#DDEFE5] text-[#183C32]'
                    }`}
                  >
                    {worker.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-[#1A1C1B] text-sm truncate group-hover:text-[#183C32] transition-colors">
                        {worker.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEEEEC] text-[#52625A] shrink-0">
                        {roleName}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#717975] font-medium mt-0.5 truncate">
                      {bType === 'salary' && `₹${worker.monthly_salary.toLocaleString('en-IN')}/mo`}
                      {bType === 'daily_rate' && `₹${worker.daily_rate}/day`}
                      {bType === 'consumption' &&
                        `${worker.litres_per_day} L @ ₹${worker.cost_per_litre}/L`}
                      {bType === 'per_unit_log' &&
                        `₹${worker.cost_per_unit}/pc ${
                          todayUnitsCount > 0 ? `• Logged ${todayUnitsCount} pc` : ''
                        }`}
                    </p>
                  </div>
                </div>

                {/* Status Toggle / Action Button */}
                <div onClick={(e) => e.stopPropagation()} className="shrink-0 ml-2">
                  {isUnitBased ? (
                    <button
                      type="button"
                      onClick={() => setLogModalWorker(worker)}
                      className="px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-[#183C32] text-white hover:bg-[#00261D] flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Shirt className="w-3.5 h-3.5 text-[#DDEFE5]" />
                      <span>Log Pieces</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => toggleAttendance(worker.id)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 ${
                        isAbsent
                          ? 'bg-[#BA1A1A] text-white hover:bg-[#93000A]'
                          : 'bg-[#183C32] text-white hover:bg-[#00261D]'
                      } ${isProcessing ? 'opacity-50 animate-pulse' : ''}`}
                    >
                      {isAbsent ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Absent</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#DDEFE5]" />
                          <span>Present</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Smart Household Insights */}
      <div className="bg-white rounded-3xl p-5 border border-[#E2E3E0] shadow-stitch space-y-3">
        <div className="flex items-center space-x-2 text-[#183C32]">
          <Sparkles className="w-4 h-4 text-[#183C32]" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#1A1C1B]">
            Household Ledger Insights
          </h3>
        </div>
        <p className="text-xs text-[#52625A] leading-relaxed font-medium">
          All helper attendance is up to date for this month. Fixed salaries automatically deduct logged absent days at the daily rate.
        </p>
      </div>

      {/* VACATION MODE MODAL */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-card-glow border border-[#E2E3E0] animate-sheet-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E3E0] mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center font-bold">
                  <Palmtree className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#1A1C1B]">Schedule Vacation Mode</h3>
              </div>
              <button
                onClick={() => setIsVacationModalOpen(false)}
                className="p-1.5 rounded-2xl text-[#717975] hover:bg-[#EEEEEC] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVacation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={vacationStartDate}
                  onChange={(e) => setVacationStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-1.5">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={vacationEndDate}
                  onChange={(e) => setVacationEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-1.5">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={vacationNote}
                  onChange={(e) => setVacationNote(e.target.value)}
                  placeholder="e.g. Out of town for Diwali"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F9F9F7] border border-[#E2E3E0] text-xs text-[#1A1C1B] font-medium focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsVacationModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl border border-[#E2E3E0] text-xs font-bold text-[#52625A] hover:bg-[#F9F9F7] transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVacation}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#183C32] text-white text-xs font-black hover:bg-[#00261D] shadow-md transition-all active:scale-95"
                >
                  {isSubmittingVacation ? 'Saving...' : 'Start Vacation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK SERVICE LOG MODAL */}
      {logModalWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-card-glow border border-[#E2E3E0] animate-sheet-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E3E0] mb-4">
              <div>
                <h3 className="text-base font-black text-[#1A1C1B]">
                  Log Pieces for {logModalWorker.name}
                </h3>
                <p className="text-xs text-[#717975] font-medium mt-0.5">
                  Rate: ₹{logModalWorker.cost_per_unit}/piece
                </p>
              </div>
              <button
                onClick={() => setLogModalWorker(null)}
                className="p-1.5 rounded-2xl text-[#717975] hover:bg-[#EEEEEC] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuickLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-1.5">
                  Number of Pieces / Pairs *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={logUnits}
                  onChange={(e) => setLogUnits(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] font-extrabold focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#414845] uppercase tracking-wider mb-1.5">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="e.g. Shirts & trousers"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F9F9F7] border border-[#E2E3E0] text-xs text-[#1A1C1B] font-medium focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              {logUnits && Number(logUnits) > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#DDEFE5]/70 text-[#183C32] text-xs font-bold flex justify-between items-center">
                  <span>Calculated Amount:</span>
                  <span className="text-base font-black">
                    ₹
                    {(
                      Number(logUnits) * (Number(logModalWorker.cost_per_unit) || 0)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setLogModalWorker(null)}
                  className="flex-1 py-3 px-4 rounded-2xl border border-[#E2E3E0] text-xs font-bold text-[#52625A] hover:bg-[#F9F9F7] transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#183C32] text-white text-xs font-black hover:bg-[#00261D] shadow-md transition-all active:scale-95"
                >
                  {isSubmittingLog ? 'Saving...' : 'Save Service Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

