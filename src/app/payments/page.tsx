'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  Worker,
  AttendanceException,
  PaymentRecord,
  ServiceLog,
  VacationPeriod,
} from '@/lib/types';
import {
  calculateWorkerPayable,
  getDaysInMonth,
  formatMonthYearHeader,
  getMonthDateRange,
} from '@/lib/utils/calculations';
import { validateNumericInput } from '@/lib/utils/validation';
import { sanitizeErrorMessage } from '@/lib/utils/errorHandling';
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calculator,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Shirt,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function PaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [monthExceptions, setMonthExceptions] = useState<AttendanceException[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Payout Modal state
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [manualOverrideAmount, setManualOverrideAmount] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const todayDate = new Date();
  const targetYear = currentMonthDate.getFullYear();
  const targetMonthIndex = currentMonthDate.getMonth();
  const monthStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}`;
  const monthYearStr = `${monthStr}-01`;

  // Check if current month date is the active current month or in the future
  const isCurrentMonth =
    targetYear === todayDate.getFullYear() && targetMonthIndex === todayDate.getMonth();
  const isFutureMonth =
    targetYear > todayDate.getFullYear() ||
    (targetYear === todayDate.getFullYear() && targetMonthIndex > todayDate.getMonth());

  const { startDate, endDate } = getMonthDateRange(currentMonthDate);
  const totalDaysInSelectedMonth = getDaysInMonth(targetYear, targetMonthIndex);

  useEffect(() => {
    let isSubscribed = true;

    if (authLoading) return;

    if (!user) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    const supabase = createClient();

    async function fetchPaymentsData() {
      try {
        setLoading(true);
        // Fetch active workers
        const { data: wData, error: wErr } = await supabase
          .from('workers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (wErr) console.error('Error fetching workers:', wErr);

        // Fetch month's attendance exceptions
        const { data: exData, error: eErr } = await supabase
          .from('attendance_exceptions')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate);

        if (eErr) console.error('Error fetching exceptions:', eErr);

        // Fetch service logs for month
        const { data: slData } = await supabase
          .from('service_logs')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate);

        // Fetch vacation periods
        const { data: vpData } = await supabase.from('vacation_periods').select('*');

        // Fetch payment records for this month
        const { data: pData, error: pErr } = await supabase
          .from('payments')
          .select('*')
          .eq('month', monthYearStr);

        if (pErr) console.error('Error fetching payments:', pErr);

        if (isSubscribed) {
          setWorkers(wData || []);
          setMonthExceptions(exData || []);
          setServiceLogs(slData || []);
          setVacationPeriods(vpData || []);
          setPayments(pData || []);
        }
      } catch (err) {
        console.error('Error fetching payments data:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    fetchPaymentsData();

    return () => {
      isSubscribed = false;
    };
  }, [user, authLoading, startDate, endDate, monthYearStr, router]);

  const changeMonth = (delta: number) => {
    // If trying to navigate into future month, block it
    if (delta > 0 && (isCurrentMonth || isFutureMonth)) {
      return;
    }
    const nextDate = new Date(currentMonthDate);
    nextDate.setMonth(nextDate.getMonth() + delta);
    setCurrentMonthDate(nextDate);
  };

  const handleMarkPaid = async (worker: Worker, finalAmt: number, calculatedAmt: number) => {
    if (isFutureMonth) {
      alert('Payment for future months cannot be recorded.');
      return;
    }

    const valRes = validateNumericInput(finalAmt, { fieldName: 'Payment Amount', min: 0, max: 500000 });
    if (!valRes.isValid) {
      alert(valRes.error || 'Invalid payment amount.');
      return;
    }

    setIsSubmittingPayment(true);
    const supabase = createClient();

    try {
      const existingPayment = payments.find((p) => p.worker_id === worker.id);

      if (existingPayment) {
        // Update payment
        const { data, error } = await supabase
          .from('payments')
          .update({
            calculated_amount: calculatedAmt,
            final_amount: finalAmt,
            paid_on: new Date().toISOString().split('T')[0],
          })
          .eq('id', existingPayment.id)
          .select()
          .single();

        if (error) throw error;
        setPayments((prev) =>
          prev.map((p) => (p.id === existingPayment.id ? (data as PaymentRecord) : p))
        );
      } else {
        // Insert new payment
        const { data, error } = await supabase
          .from('payments')
          .insert({
            worker_id: worker.id,
            month: monthYearStr,
            calculated_amount: calculatedAmt,
            final_amount: finalAmt,
            paid_on: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setPayments((prev) => [...prev, data as PaymentRecord]);
        }
      }

      setSelectedWorker(null);
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
        <p className="text-sm font-medium">Calculating monthly payments...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate totals across all workers using unified calculation utility
  let totalEffectiveBaseSum = 0;
  let totalDeductionsSum = 0;
  let totalFinalPayoutSum = 0;
  let totalPaidOutSum = 0;

  const workerSalaryDetails = workers.map((worker) => {
    const calc = calculateWorkerPayable({
      worker,
      targetYear,
      targetMonthIndex,
      exceptions: monthExceptions,
      serviceLogs,
      vacationPeriods,
      payments,
    });

    const paymentRecord = payments.find((p) => p.worker_id === worker.id);
    const isPaid = Boolean(paymentRecord);
    const actualPayout = paymentRecord
      ? Number(paymentRecord.final_amount)
      : calc.calculatedPayable;

    totalEffectiveBaseSum += calc.effectiveBaseSalary;
    totalDeductionsSum += calc.totalDeduction;
    totalFinalPayoutSum += calc.calculatedPayable;
    if (isPaid) {
      totalPaidOutSum += actualPayout;
    }

    return {
      worker,
      calc,
      paymentRecord,
      isPaid,
      actualPayout,
    };
  });

  const selectedRecord = selectedWorker
    ? workerSalaryDetails.find((d) => d.worker.id === selectedWorker.id)
    : null;

  return (
    <div className="px-4 pt-4 pb-24 space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#1A1C1B]">Monthly Payout Summary</h1>
        <p className="text-xs text-[#717975]">
          Role-specific billing totals, absence deductions & vacation proration
        </p>
      </div>

      {/* Month Selector Header */}
      <div className="bg-[#183C32] text-white rounded-3xl p-5 shadow-stitch flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#DDEFE5]">
            Billing Period ({totalDaysInSelectedMonth} Days)
          </span>
          <h2 className="text-lg font-bold">{formatMonthYearHeader(currentMonthDate)}</h2>
        </div>

        <button
          disabled={isCurrentMonth || isFutureMonth}
          onClick={() => changeMonth(1)}
          className={`p-2 rounded-xl transition-colors ${
            isCurrentMonth || isFutureMonth
              ? 'opacity-30 cursor-not-allowed text-white/50'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isCurrentMonth || isFutureMonth ? 'Future months disabled' : 'Next Month'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Future Month Alert Banner */}
      {isFutureMonth && (
        <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/30 text-[#92400E] text-xs font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Future billing period selected. Payments cannot be recorded for future months.</span>
        </div>
      )}

      {/* Overall Month Financial Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-[#E2E3E0] shadow-stitch">
          <span className="text-[10px] font-semibold text-[#717975] uppercase">Total Base</span>
          <p className="text-base sm:text-lg font-bold text-[#1A1C1B] mt-0.5">
            ₹{totalEffectiveBaseSum.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-[#FFDAD6]/40 rounded-2xl p-3.5 border border-[#BA1A1A]/10 shadow-stitch">
          <span className="text-[10px] font-semibold text-[#BA1A1A] uppercase">Total Deductions</span>
          <p className="text-base sm:text-lg font-bold text-[#BA1A1A] mt-0.5">
            -₹{totalDeductionsSum.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-[#DDEFE5]/40 rounded-2xl p-3.5 border border-[#183C32]/10 shadow-stitch">
          <span className="text-[10px] font-semibold text-[#183C32] uppercase">Net Payable</span>
          <p className="text-base sm:text-lg font-bold text-[#183C32] mt-0.5">
            ₹{totalFinalPayoutSum.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Worker Payout Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#414845] uppercase tracking-wider">
          Staff Payout Ledger
        </h3>

        {workerSalaryDetails.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#E2E3E0] text-center shadow-stitch">
            <p className="text-sm font-semibold text-[#717975]">No active staff members found.</p>
          </div>
        ) : (
          workerSalaryDetails.map(({ worker, calc, paymentRecord, isPaid, actualPayout }) => {
            const roleName = worker.role === 'Other' ? worker.custom_role_name || 'Other' : worker.role;
            const bType = worker.billing_type || 'salary';

            return (
              <div
                key={worker.id}
                onClick={() => router.push(`/helpers/${worker.id}`)}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-stitch space-y-3 cursor-pointer group hover:border-[#183C32]/40 ${
                  isPaid ? 'border-[#183C32]/30 bg-[#F9FBF9]' : 'border-[#E2E3E0]'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-[#DDEFE5] text-[#183C32] font-bold text-base flex items-center justify-center">
                      {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-[#1A1C1B] text-base group-hover:text-[#183C32]">
                          {worker.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEEEEC] text-[#52625A]">
                          {roleName}
                        </span>
                      </div>
                      <p className="text-xs text-[#717975] mt-0.5">
                        Model: <span className="capitalize font-semibold">{bType.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                      isFutureMonth
                        ? 'bg-[#F3F4F6] text-[#6B7280]'
                        : isPaid
                        ? 'bg-[#DDEFE5] text-[#183C32]'
                        : 'bg-[#FEF3C7] text-[#92400E]'
                    }`}
                  >
                    {isFutureMonth ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : isPaid ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{isFutureMonth ? 'Future' : isPaid ? 'Paid' : 'Pending'}</span>
                  </span>
                </div>

                {/* Calculation Formula Summary Box */}
                <div className="p-3 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#52625A]">
                    <span>Calculation Formula:</span>
                    <span className="font-semibold text-[#183C32]">{calc.breakdownSummary}</span>
                  </div>

                  {bType === 'salary' && calc.absentDays > 0 && (
                    <div className="flex justify-between text-[#BA1A1A]">
                      <span>Absence Deduction ({calc.absentDays} days):</span>
                      <span className="font-medium">-₹{calc.totalDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-[#E2E3E0] flex justify-between font-bold text-sm text-[#1A1C1B]">
                    <span>Calculated Payout:</span>
                    <span className="text-[#183C32]">₹{calc.calculatedPayable.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Action Row */}
                <div
                  className="flex items-center justify-between pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    {isPaid && paymentRecord && (
                      <span className="text-[11px] text-[#717975]">
                        Paid ₹{Number(paymentRecord.final_amount).toLocaleString('en-IN')} on{' '}
                        {new Date(paymentRecord.paid_on).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      disabled={isFutureMonth}
                      onClick={() => {
                        setSelectedWorker(worker);
                        setManualOverrideAmount(actualPayout.toString());
                      }}
                      className="px-4 py-1.5 rounded-xl bg-[#183C32] text-white hover:bg-[#00261D] text-xs font-semibold transition-all shadow-stitch disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{isPaid ? 'Edit Payout' : 'Mark as Paid'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Flexible Custom Payout Modal */}
      {selectedWorker && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-stitch-lg border border-[#E2E3E0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E3E0] mb-3">
              <div>
                <h3 className="text-base font-bold text-[#1A1C1B]">
                  Record Payment: {selectedWorker.name}
                </h3>
                <p className="text-xs text-[#717975]">
                  {selectedWorker.role === 'Other'
                    ? selectedWorker.custom_role_name || 'Other'
                    : selectedWorker.role}{' '}
                  • {formatMonthYearHeader(currentMonthDate)}
                </p>
              </div>
              <button
                onClick={() => setSelectedWorker(null)}
                className="p-1 rounded-full text-[#717975] hover:bg-[#EEEEEC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calculated reference info */}
            <div className="p-3 rounded-xl bg-[#DDEFE5]/50 border border-[#183C32]/20 mb-4 text-xs space-y-1">
              <div className="flex justify-between text-[#183C32] font-semibold">
                <span>Calculated Payable:</span>
                <span className="font-bold text-sm">
                  ₹{selectedRecord.calc.calculatedPayable.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-[#52625A]">{selectedRecord.calc.breakdownSummary}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                  Amount to Pay (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={manualOverrideAmount}
                  onChange={(e) => setManualOverrideAmount(e.target.value)}
                  placeholder="Enter payout amount"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-base font-bold text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setManualOverrideAmount(selectedRecord.calc.calculatedPayable.toString())
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#EEEEEC] hover:bg-[#E2E3E0] text-[11px] font-semibold text-[#414845] transition-colors"
                >
                  Exact (₹{selectedRecord.calc.calculatedPayable})
                </button>
                {selectedRecord.calc.calculatedPayable > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setManualOverrideAmount(
                        (Math.ceil(selectedRecord.calc.calculatedPayable / 100) * 100).toString()
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#EEEEEC] hover:bg-[#E2E3E0] text-[11px] font-semibold text-[#414845] transition-colors"
                  >
                    Round Up (₹
                    {Math.ceil(selectedRecord.calc.calculatedPayable / 100) * 100})
                  </button>
                )}
              </div>

              {/* Difference Status Badge */}
              {manualOverrideAmount !== '' && !isNaN(Number(manualOverrideAmount)) && (
                <div className="text-xs font-medium pt-1">
                  {Number(manualOverrideAmount) === selectedRecord.calc.calculatedPayable ? (
                    <span className="text-[#183C32] bg-[#DDEFE5] px-2.5 py-1 rounded-lg inline-block">
                      ✓ Matches calculated payout
                    </span>
                  ) : Number(manualOverrideAmount) > selectedRecord.calc.calculatedPayable ? (
                    <span className="text-[#183C32] bg-[#DDEFE5] px-2.5 py-1 rounded-lg inline-block">
                      +₹
                      {(
                        Number(manualOverrideAmount) - selectedRecord.calc.calculatedPayable
                      ).toLocaleString('en-IN')}{' '}
                      (Bonus / Overpayment)
                    </span>
                  ) : (
                    <span className="text-[#BA1A1A] bg-[#FFDAD6] px-2.5 py-1 rounded-lg inline-block">
                      -₹
                      {(
                        selectedRecord.calc.calculatedPayable - Number(manualOverrideAmount)
                      ).toLocaleString('en-IN')}{' '}
                      (Deduction / Advance Adjustment)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSelectedWorker(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-[#E2E3E0] text-xs font-semibold text-[#52625A] hover:bg-[#F9F9F7]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isSubmittingPayment ||
                  manualOverrideAmount === '' ||
                  isNaN(Number(manualOverrideAmount)) ||
                  Number(manualOverrideAmount) < 0
                }
                onClick={() => {
                  const num = Number(manualOverrideAmount);
                  if (isNaN(num) || num < 0) return;
                  handleMarkPaid(selectedWorker, num, selectedRecord.calc.calculatedPayable);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#183C32] text-white text-xs font-semibold hover:bg-[#00261D] disabled:opacity-50"
              >
                {isSubmittingPayment ? 'Saving...' : 'Save & Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
