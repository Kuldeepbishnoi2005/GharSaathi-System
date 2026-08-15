'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Worker, AttendanceException, ServiceLog, PaymentRecord, VacationPeriod } from '@/lib/types';
import {
  calculateWorkerPayable,
  getDaysInMonth,
  formatMonthYearHeader,
  formatDateISO,
  isDateInVacation,
} from '@/lib/utils/calculations';
import { validateIsoDate, validateNumericInput, validateNoteText } from '@/lib/utils/validation';
import { sanitizeErrorMessage } from '@/lib/utils/errorHandling';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Shirt,
  DollarSign,
  AlertCircle,
  Edit2,
  Clock,
} from 'lucide-react';

export default function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workerId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [exceptions, setExceptions] = useState<AttendanceException[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Month navigation state
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Log Entry Modal state for unit-based roles
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logDate, setLogDate] = useState(formatDateISO(new Date()));
  const [logUnits, setLogUnits] = useState('');
  const [logNote, setLogNote] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Payment modal/action state
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const todayStr = formatDateISO(new Date());

  const targetYear = currentMonthDate.getFullYear();
  const targetMonthIndex = currentMonthDate.getMonth();
  const totalDaysInSelectedMonth = getDaysInMonth(targetYear, targetMonthIndex);
  const monthStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}`;

  useEffect(() => {
    let isSubscribed = true;

    if (authLoading) return;

    if (!user) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    const supabase = createClient();

    async function loadWorkerDetails() {
      try {
        setLoading(true);
        // Fetch worker
        const { data: wData, error: wErr } = await supabase
          .from('workers')
          .select('*')
          .eq('id', workerId)
          .single();

        if (wErr) throw wErr;

        // Fetch attendance exceptions
        const { data: exData } = await supabase
          .from('attendance_exceptions')
          .select('*')
          .eq('worker_id', workerId);

        // Fetch service logs
        const { data: slData } = await supabase
          .from('service_logs')
          .select('*')
          .eq('worker_id', workerId)
          .order('date', { ascending: false });

        // Fetch vacation periods for user
        const { data: vpData } = await supabase.from('vacation_periods').select('*');

        // Fetch payment history
        const { data: pData } = await supabase
          .from('payments')
          .select('*')
          .eq('worker_id', workerId)
          .order('month', { ascending: false });

        if (isSubscribed) {
          setWorker(wData as Worker);
          setExceptions((exData as AttendanceException[]) || []);
          setServiceLogs((slData as ServiceLog[]) || []);
          setVacationPeriods((vpData as VacationPeriod[]) || []);
          setPayments((pData as PaymentRecord[]) || []);
        }
      } catch (err) {
        console.error('Error fetching worker details:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadWorkerDetails();

    return () => {
      isSubscribed = false;
    };
  }, [user, authLoading, workerId, router]);

  const changeMonth = (delta: number) => {
    const nextDate = new Date(currentMonthDate);
    nextDate.setMonth(nextDate.getMonth() + delta);
    setCurrentMonthDate(nextDate);
  };

  // Toggle Attendance on specific date from Calendar
  const handleToggleDateAttendance = async (dateStr: string) => {
    if (!worker) return;
    // Block future dates
    if (dateStr > todayStr) return;
    // Block vacation dates
    if (isDateInVacation(dateStr, vacationPeriods)) return;

    const supabase = createClient();
    const existingEx = exceptions.find((ex) => ex.date === dateStr);

    if (existingEx) {
      // Mark Present -> Remove exception
      setExceptions((prev) => prev.filter((ex) => ex.id !== existingEx.id));
      const { error } = await supabase
        .from('attendance_exceptions')
        .delete()
        .eq('id', existingEx.id);

      if (error) {
        console.error('Failed to remove exception:', error);
        setExceptions((prev) => [...prev, existingEx]);
      }
    } else {
      // Mark Absent -> Insert exception
      const tempId = `temp-${Date.now()}`;
      const newEx: AttendanceException = {
        id: tempId,
        worker_id: worker.id,
        date: dateStr,
        status: 'absent',
      };

      setExceptions((prev) => [...prev, newEx]);

      const { data, error } = await supabase
        .from('attendance_exceptions')
        .insert({
          worker_id: worker.id,
          date: dateStr,
          status: 'absent',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to add absent exception:', error);
        setExceptions((prev) => prev.filter((ex) => ex.id !== tempId));
      } else if (data) {
        setExceptions((prev) =>
          prev.map((ex) => (ex.id === tempId ? (data as AttendanceException) : ex))
        );
      }
    }
  };

  // Add Service Log (e.g. Ironing dropoff)
  const handleAddServiceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;

    const dateVal = validateIsoDate(logDate, 'Log Date');
    if (!dateVal.isValid) {
      alert(dateVal.error || 'Invalid date.');
      return;
    }

    const unitVal = validateNumericInput(logUnits, { fieldName: 'Number of pieces/units', min: 1, max: 10000, allowZero: false, integerOnly: true });
    if (!unitVal.isValid) {
      alert(unitVal.error || 'Invalid units count.');
      return;
    }

    const noteVal = validateNoteText(logNote, 250);
    if (!noteVal.isValid) {
      alert(noteVal.error || 'Invalid note.');
      return;
    }

    const unitsNum = Number(logUnits);
    const costPerUnit = Number(worker.cost_per_unit) || 0;
    const amountNum = Math.round(unitsNum * costPerUnit);

    setIsSubmittingLog(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('service_logs')
        .insert({
          worker_id: worker.id,
          date: logDate,
          units: unitsNum,
          amount: amountNum,
          note: logNote.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setServiceLogs((prev) => [data as ServiceLog, ...prev]);
      }

      setIsLogModalOpen(false);
      setLogUnits('');
      setLogNote('');
    } catch (err: any) {
      alert(sanitizeErrorMessage(err, 'Failed to add service log entry. Please try again.'));
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleDeleteServiceLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log entry?')) return;

    const supabase = createClient();
    try {
      const { error } = await supabase.from('service_logs').delete().eq('id', logId);
      if (error) throw error;
      setServiceLogs((prev) => prev.filter((l) => l.id !== logId));
    } catch (err: any) {
      alert(sanitizeErrorMessage(err, 'Failed to delete service log entry.'));
    }
  };

  // Mark Month as Paid
  const handleMarkAsPaid = async (payableAmount: number) => {
    if (!worker) return;

    const valRes = validateNumericInput(payableAmount, { fieldName: 'Payable Amount', min: 0, max: 500000 });
    if (!valRes.isValid) {
      alert(valRes.error || 'Invalid payment amount.');
      return;
    }

    setIsSubmittingPayment(true);
    const supabase = createClient();

    const monthYearStr = `${monthStr}-01`;
    const existingP = payments.find((p) => p.month.startsWith(monthStr));

    try {
      if (existingP) {
        const { data, error } = await supabase
          .from('payments')
          .update({
            calculated_amount: payableAmount,
            final_amount: payableAmount,
            paid_on: todayStr,
          })
          .eq('id', existingP.id)
          .select()
          .single();

        if (error) throw error;
        setPayments((prev) => prev.map((p) => (p.id === existingP.id ? (data as PaymentRecord) : p)));
      } else {
        const { data, error } = await supabase
          .from('payments')
          .insert({
            worker_id: worker.id,
            month: monthYearStr,
            calculated_amount: payableAmount,
            final_amount: payableAmount,
            paid_on: todayStr,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setPayments((prev) => [data as PaymentRecord, ...prev]);
        }
      }
    } catch (err: any) {
      alert(sanitizeErrorMessage(err, 'Failed to record payment. Please try again.'));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#717975]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#183C32] mb-2" />
        <p className="text-sm font-medium">Loading staff profile & ledger...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-[#1A1C1B]">Staff member not found</h2>
        <button
          onClick={() => router.push('/helpers')}
          className="mt-4 px-4 py-2 rounded-xl bg-[#183C32] text-white text-xs font-semibold"
        >
          Back to Helpers
        </button>
      </div>
    );
  }

  const roleDisplayName = worker.role === 'Other' ? worker.custom_role_name || 'Other' : worker.role;
  const isUnitBased = worker.billing_type === 'per_unit_log';

  // Compute stats using shared utility
  const calc = calculateWorkerPayable({
    worker,
    targetYear,
    targetMonthIndex,
    exceptions,
    serviceLogs,
    vacationPeriods,
    payments,
  });

  return (
    <div className="px-4 pt-4 pb-24 space-y-5">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/helpers')}
          className="px-3 py-1.5 rounded-xl border border-[#E2E3E0] bg-white text-xs font-semibold text-[#52625A] hover:bg-[#F9F9F7] flex items-center space-x-1.5 transition-all shadow-stitch"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="text-xs font-semibold text-[#717975]">Staff Detail View</span>
      </div>

      {/* Worker Header Card */}
      <div className="bg-[#183C32] text-white rounded-3xl p-6 shadow-stitch relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#DDEFE5]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#DDEFE5] text-[#183C32] font-bold text-xl flex items-center justify-center shadow-stitch">
              {worker.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold">{worker.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DDEFE5]/20 text-[#DDEFE5]">
                  {roleDisplayName}
                </span>
              </div>
              <p className="text-xs text-[#DDEFE5]/80 mt-1">
                Joined:{' '}
                {new Date(worker.joining_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Rate Info Banner */}
        <div className="pt-3 border-t border-[#DDEFE5]/20 flex items-center justify-between text-xs text-[#DDEFE5]">
          <div className="flex items-center space-x-1.5">
            <Calculator className="w-4 h-4 text-[#DDEFE5]" />
            <span>
              Billing Model:{' '}
              <strong className="capitalize text-white">
                {worker.billing_type.replace('_', ' ')}
              </strong>
            </span>
          </div>

          <div className="font-bold text-white text-sm bg-white/10 px-3 py-1 rounded-xl">
            {worker.billing_type === 'salary' && `₹${worker.monthly_salary.toLocaleString('en-IN')}/mo`}
            {worker.billing_type === 'daily_rate' && `₹${worker.daily_rate}/day`}
            {worker.billing_type === 'consumption' &&
              `${worker.litres_per_day} L @ ₹${worker.cost_per_litre}/L`}
            {worker.billing_type === 'per_unit_log' && `₹${worker.cost_per_unit}/piece`}
          </div>
        </div>
      </div>

      {/* Month Navigator Header */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E3E0] shadow-stitch flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-[#1A1C1B] hover:bg-[#EEEEEC] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-semibold text-[#717975] uppercase">Selected Month</span>
          <h2 className="text-base font-bold text-[#1A1C1B]">{formatMonthYearHeader(currentMonthDate)}</h2>
        </div>

        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-[#1A1C1B] hover:bg-[#EEEEEC] transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {!isUnitBased ? (
          <>
            <div className="bg-white rounded-2xl p-3.5 border border-[#E2E3E0] shadow-stitch">
              <span className="text-[10px] font-semibold text-[#717975] uppercase">Working Days</span>
              <p className="text-xl font-bold text-[#1A1C1B] mt-0.5">{calc.applicableDays}</p>
              <span className="text-[10px] text-[#717975]">
                {calc.vacationDaysInMonth > 0 ? `(${calc.vacationDaysInMonth} vacation days)` : 'Full month'}
              </span>
            </div>

            <div className="bg-[#DDEFE5]/40 rounded-2xl p-3.5 border border-[#183C32]/10 shadow-stitch">
              <span className="text-[10px] font-semibold text-[#183C32] uppercase">Present Days</span>
              <p className="text-xl font-bold text-[#183C32] mt-0.5">{calc.presentDays}</p>
            </div>

            <div className="bg-[#FFDAD6]/40 rounded-2xl p-3.5 border border-[#BA1A1A]/10 shadow-stitch">
              <span className="text-[10px] font-semibold text-[#BA1A1A] uppercase">Absent Days</span>
              <p className="text-xl font-bold text-[#BA1A1A] mt-0.5">{calc.absentDays}</p>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-3.5 border border-[#E2E3E0] shadow-stitch col-span-2 sm:col-span-3">
            <span className="text-[10px] font-semibold text-[#717975] uppercase">Total Units / Clothes Logged</span>
            <p className="text-xl font-bold text-[#1A1C1B] mt-0.5">
              {calc.totalUnits} pieces @ ₹{worker.cost_per_unit}/piece
            </p>
          </div>
        )}

        <div className="bg-[#183C32] text-white rounded-2xl p-3.5 shadow-stitch col-span-2 sm:col-span-1">
          <span className="text-[10px] font-semibold uppercase opacity-80">Calculated Payable</span>
          <p className="text-xl font-bold mt-0.5">₹{calc.calculatedPayable.toLocaleString('en-IN')}</p>
          <span className="text-[10px] opacity-80 block truncate">{calc.breakdownSummary}</span>
        </div>
      </div>

      {/* WORKER ATTENDANCE CALENDAR OR SERVICE LOG LIST */}
      {!isUnitBased ? (
        /* Visual Calendar View */
        <div className="bg-white rounded-3xl p-5 border border-[#E2E3E0] shadow-stitch space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1A1C1B]">Attendance Calendar</h3>
              <p className="text-xs text-[#717975]">
                Tap any past date to toggle Present (Green) / Absent (Red)
              </p>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-medium">
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#183C32]" />
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]" />
                <span>Absent</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]" />
                <span>Vacation</span>
              </div>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-[#717975] border-b border-[#E2E3E0] pb-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {(() => {
              const firstDayOfWeek = new Date(targetYear, targetMonthIndex, 1).getDay();
              const blanks = Array.from({ length: firstDayOfWeek });
              const daysInMonth = Array.from({ length: totalDaysInSelectedMonth }, (_, i) => i + 1);

              return (
                <>
                  {blanks.map((_, idx) => (
                    <div key={`blank-${idx}`} className="h-10 sm:h-12" />
                  ))}
                  {daysInMonth.map((dayNum) => {
                    const dateStr = `${monthStr}-${String(dayNum).padStart(2, '0')}`;
                    const isFuture = dateStr > todayStr;
                    const isBeforeJoining = dateStr < worker.joining_date;
                    const isVacation = isDateInVacation(dateStr, vacationPeriods);
                    const isAbsent = exceptions.some((ex) => ex.date === dateStr);

                    let statusBg = 'bg-[#DDEFE5] text-[#183C32] hover:bg-[#cbe6d7]';
                    let statusDot = 'bg-[#183C32]';
                    let label = 'Present';

                    if (isBeforeJoining) {
                      statusBg = 'bg-[#EEEEEC]/50 text-[#9CA3AF] cursor-not-allowed';
                      statusDot = 'bg-[#9CA3AF]';
                      label = 'N/A';
                    } else if (isFuture) {
                      statusBg = 'bg-[#F9F9F7] text-[#717975] cursor-not-allowed opacity-60';
                      statusDot = 'bg-[#DDEFE5]';
                      label = 'Upcoming';
                    } else if (isAbsent) {
                      statusBg = 'bg-[#FFDAD6] text-[#93000A] font-bold hover:bg-[#ffc7c2] shadow-sm';
                      statusDot = 'bg-[#BA1A1A]';
                      label = 'Absent';
                    } else if (isVacation) {
                      statusBg = 'bg-[#DDEFE5] text-[#183C32] border border-dashed border-[#F59E0B] hover:bg-[#cbe6d7]';
                      statusDot = 'bg-[#F59E0B]';
                      label = 'Vacation (Present)';
                    }

                    return (
                      <button
                        key={dateStr}
                        disabled={isFuture || isBeforeJoining}
                        onClick={() => handleToggleDateAttendance(dateStr)}
                        className={`h-10 sm:h-12 rounded-xl p-1 flex flex-col items-center justify-between transition-all ${statusBg}`}
                        title={`${dateStr}: ${label}`}
                      >
                        <span className="text-xs font-semibold">{dayNum}</span>
                        <div className={`w-2 h-2 rounded-full mb-0.5 ${statusDot}`} />
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        /* Unit-Based Role Service Logs List */
        <div className="bg-white rounded-3xl p-5 border border-[#E2E3E0] shadow-stitch space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1A1C1B]">Service Log Entries ({serviceLogs.length})</h3>
              <p className="text-xs text-[#717975]">
                Log drop-offs (pieces/pairs given) to track total payable amount
              </p>
            </div>

            <button
              onClick={() => setIsLogModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#183C32] hover:bg-[#00261D] text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-stitch"
            >
              <Plus className="w-4 h-4 text-[#DDEFE5]" />
              <span>Log Entry</span>
            </button>
          </div>

          {serviceLogs.length === 0 ? (
            <div className="p-8 text-center bg-[#F9F9F7] rounded-2xl border border-[#E2E3E0]">
              <Shirt className="w-8 h-8 text-[#183C32] mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold text-[#717975]">No service entries logged yet.</p>
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="mt-3 px-3 py-1.5 rounded-xl bg-[#183C32] text-white text-xs font-semibold"
              >
                Log First Entry
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {serviceLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#F9F9F7] rounded-2xl p-3.5 border border-[#E2E3E0] flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center font-bold text-sm">
                      <Shirt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-[#1A1C1B]">
                          {log.units} {log.units === 1 ? 'Piece' : 'Pieces/Pairs'}
                        </span>
                        <span className="text-xs text-[#717975]">
                          ({new Date(log.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })})
                        </span>
                      </div>
                      {log.note && <p className="text-xs text-[#52625A] mt-0.5">Note: "{log.note}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="font-bold text-sm text-[#183C32]">₹{log.amount}</span>
                      <span className="block text-[10px] text-[#717975]">@ ₹{worker.cost_per_unit}/pc</span>
                    </div>

                    <button
                      onClick={() => handleDeleteServiceLog(log.id)}
                      className="p-2 text-[#717975] hover:text-[#BA1A1A] hover:bg-[#FFDAD6]/50 rounded-xl transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAYMENT HISTORY SECTION */}
      <div className="bg-white rounded-3xl p-5 border border-[#E2E3E0] shadow-stitch space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1A1C1B]">Payment Ledger History</h3>
            <p className="text-xs text-[#717975]">Track past month payouts and mark current status</p>
          </div>

          <button
            disabled={isSubmittingPayment}
            onClick={() => handleMarkAsPaid(calc.calculatedPayable)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-stitch ${
              calc.isPaid
                ? 'bg-[#DDEFE5] text-[#183C32] hover:bg-[#cbe6d7]'
                : 'bg-[#183C32] text-white hover:bg-[#00261D]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{calc.isPaid ? 'Re-confirm Paid' : 'Mark Month Paid'}</span>
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="p-6 text-center bg-[#F9F9F7] rounded-2xl border border-[#E2E3E0]">
            <Clock className="w-6 h-6 text-[#717975] mx-auto mb-1 opacity-60" />
            <p className="text-xs text-[#717975]">No past payment records logged yet for this worker.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {payments.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-[#F9F9F7] border border-[#E2E3E0] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-[#1A1C1B] text-sm">
                    {new Date(p.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <p className="text-[#717975] mt-0.5">
                    Paid on: {new Date(p.paid_on).toLocaleDateString('en-IN')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-sm text-[#183C32]">
                    ₹{Number(p.final_amount).toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-[#183C32] font-semibold bg-[#DDEFE5] px-2 py-0.5 rounded-full mt-0.5">
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-stitch-lg border border-[#E2E3E0]">
            <h3 className="text-base font-bold text-[#1A1C1B]">Add Service Log Entry</h3>
            <p className="text-xs text-[#717975] mt-0.5">
              Log pieces/pairs given for {worker.name} (@ ₹{worker.cost_per_unit}/piece)
            </p>

            <form onSubmit={handleAddServiceLog} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="e.g. 5 shirts, 7 pants"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-xs text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              {logUnits && Number(logUnits) > 0 && (
                <div className="p-3 rounded-xl bg-[#DDEFE5]/50 text-[#183C32] text-xs font-semibold flex justify-between">
                  <span>Calculated Amount:</span>
                  <span>
                    ₹{(Number(logUnits) * (Number(worker.cost_per_unit) || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#E2E3E0] text-xs font-semibold text-[#52625A] hover:bg-[#F9F9F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#183C32] text-white text-xs font-semibold hover:bg-[#00261D]"
                >
                  {isSubmittingLog ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
