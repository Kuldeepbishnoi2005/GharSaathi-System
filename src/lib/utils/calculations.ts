import {
  Worker,
  AttendanceException,
  PaymentRecord,
  ServiceLog,
  VacationPeriod,
  WorkerSalaryCalculation,
} from '../types';

/**
 * Gets the number of days in a specific month of a year.
 * @param year e.g. 2026
 * @param monthIndex 0-indexed (0 = Jan, 7 = Aug, 11 = Dec)
 */
export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats month Date object to header string (e.g., "August 2026")
 */
export function formatMonthYearHeader(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Gets start and end YYYY-MM-DD strings for a month Date object
 */
export function getMonthDateRange(monthDate: Date): { startDate: string; endDate: string } {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const mStr = String(month + 1).padStart(2, '0');
  return {
    startDate: `${year}-${mStr}-01`,
    endDate: `${year}-${mStr}-${String(daysInMonth).padStart(2, '0')}`,
  };
}

/**
 * Checks if a specific date string (YYYY-MM-DD) falls inside any vacation period
 */
export function isDateInVacation(dateStr: string, vacationPeriods: VacationPeriod[]): boolean {
  return vacationPeriods.some((vp) => dateStr >= vp.start_date && dateStr <= vp.end_date);
}

/**
 * Shared calculation utility function that computes total payable amount
 * for any worker based on their role billing_type, attendance exceptions,
 * service logs, and vacation periods.
 */
export function calculateWorkerPayable({
  worker,
  targetYear,
  targetMonthIndex,
  exceptions = [],
  serviceLogs = [],
  vacationPeriods = [],
  payments = [],
}: {
  worker: Worker;
  targetYear: number;
  targetMonthIndex: number; // 0-indexed
  exceptions?: AttendanceException[];
  serviceLogs?: ServiceLog[];
  vacationPeriods?: VacationPeriod[];
  payments?: PaymentRecord[];
}): WorkerSalaryCalculation {
  const totalDaysInMonth = getDaysInMonth(targetYear, targetMonthIndex);
  const monthStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}`;
  const monthFirstDayStr = `${monthStr}-01`;
  const monthLastDayStr = `${monthStr}-${String(totalDaysInMonth).padStart(2, '0')}`;

  const joiningDateStr = worker.joining_date || monthFirstDayStr;

  // Build set of vacation dates in this month
  const vacationDatesSet = new Set<string>();
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    if (isDateInVacation(dStr, vacationPeriods)) {
      vacationDatesSet.add(dStr);
    }
  }

  const vacationDaysInMonth = vacationDatesSet.size;

  // Check if worker joined after this month
  const isJoinedInFutureMonth = joiningDateStr > monthLastDayStr;

  // Applicable days for calculation in this month
  const applicableDaysCount = isJoinedInFutureMonth ? 0 : totalDaysInMonth;

  // Filter attendance exceptions for this worker in target month
  const workerExceptions = exceptions.filter((ex) => {
    if (ex.worker_id !== worker.id) return false;
    if (ex.date < monthFirstDayStr || ex.date > monthLastDayStr) return false;
    return true;
  });

  const absentDays = workerExceptions.length;
  const presentDays = Math.max(0, applicableDaysCount - absentDays);

  let calculatedPayable = 0;
  let effectiveBaseSalary = 0;
  let dailyDeductionRate = 0;
  let totalDeduction = 0;
  let totalUnits = 0;
  let breakdownSummary = '';

  // Smart billing model detection (fallback to salary if model rate fields are missing)
  let billingType = worker.billing_type || 'salary';

  if (billingType === 'daily_rate' && (!worker.daily_rate || Number(worker.daily_rate) <= 0) && Number(worker.monthly_salary) > 0) {
    billingType = 'salary';
  } else if (billingType === 'consumption' && (!worker.cost_per_litre || Number(worker.cost_per_litre) <= 0) && Number(worker.monthly_salary) > 0) {
    billingType = 'salary';
  }

  if (isJoinedInFutureMonth) {
    calculatedPayable = 0;
    effectiveBaseSalary = 0;
    breakdownSummary = `Joined on ${joiningDateStr} (Future)`;
  } else {
    switch (billingType) {
      case 'daily_rate': {
        // Newspaper or Daily Rate Role
        const dailyRate = Number(worker.daily_rate) || 0;
        effectiveBaseSalary = dailyRate * applicableDaysCount;
        calculatedPayable = Math.round(presentDays * dailyRate);
        breakdownSummary = `${presentDays} present days × ₹${dailyRate}/day`;
        break;
      }

      case 'consumption': {
        // Milkman Role
        const litresPerDay = Number(worker.litres_per_day) || 0;
        const costPerLitre = Number(worker.cost_per_litre) || 0;
        const dailyCost = litresPerDay * costPerLitre;
        effectiveBaseSalary = dailyCost * applicableDaysCount;
        calculatedPayable = Math.round(presentDays * dailyCost);
        const totalLitres = Math.round(presentDays * litresPerDay * 100) / 100;
        breakdownSummary = `${presentDays} days (${totalLitres} L @ ₹${costPerLitre}/L)`;
        break;
      }

      case 'per_unit_log': {
        // Ironing or Unit-Log Role
        const costPerUnit = Number(worker.cost_per_unit) || 0;
        // Filter logs for this worker in target month, excluding vacation dates
        const eligibleLogs = serviceLogs.filter((log) => {
          if (log.worker_id !== worker.id) return false;
          if (log.date < monthFirstDayStr || log.date > monthLastDayStr) return false;
          if (vacationDatesSet.has(log.date)) return false;
          return true;
        });

        totalUnits = eligibleLogs.reduce((sum, log) => sum + (Number(log.units) || 0), 0);
        const loggedPayable = Math.round(
          eligibleLogs.reduce((sum, log) => sum + (Number(log.amount) || Number(log.units) * costPerUnit), 0)
        );

        // Fallback to monthly salary if no unit logs and monthly_salary is configured
        if (loggedPayable === 0 && Number(worker.monthly_salary) > 0) {
          const baseSalary = Number(worker.monthly_salary) || 0;
          effectiveBaseSalary = baseSalary;
          dailyDeductionRate = totalDaysInMonth > 0 ? baseSalary / totalDaysInMonth : 0;
          totalDeduction = absentDays * dailyDeductionRate;
          calculatedPayable = Math.max(0, Math.round(effectiveBaseSalary - totalDeduction));
          breakdownSummary = `Base ₹${baseSalary.toLocaleString('en-IN')} (No unit logs yet)`;
        } else {
          calculatedPayable = loggedPayable;
          effectiveBaseSalary = loggedPayable;
          breakdownSummary = `${totalUnits} total units/pieces @ ₹${costPerUnit}/piece`;
        }
        break;
      }

      case 'salary':
      default: {
        // Standard Monthly Salary Role
        const baseSalary = Number(worker.monthly_salary) || 0;

        // Deduction rate per day
        if (worker.deduction_mode === 'manual' && Number(worker.manual_deduction_amount) > 0) {
          dailyDeductionRate = Number(worker.manual_deduction_amount);
        } else {
          dailyDeductionRate = totalDaysInMonth > 0 ? baseSalary / totalDaysInMonth : 0;
        }

        effectiveBaseSalary = baseSalary;
        totalDeduction = absentDays * dailyDeductionRate;
        calculatedPayable = Math.max(0, Math.round(effectiveBaseSalary - totalDeduction));

        if (absentDays > 0) {
          breakdownSummary = `Base ₹${baseSalary.toLocaleString('en-IN')} - ${absentDays} absent days (₹${Math.round(
            totalDeduction
          ).toLocaleString('en-IN')})`;
        } else {
          breakdownSummary = `Base ₹${baseSalary.toLocaleString('en-IN')} (0 absences)`;
        }
        break;
      }
    }
  }

  // Check if payment is already logged for this month
  const paymentRecord = payments.find((p) => {
    if (p.worker_id !== worker.id) return false;
    return p.month.startsWith(monthStr);
  });

  return {
    worker,
    monthStr,
    totalDaysInMonth,
    vacationDaysInMonth,
    applicableDays: applicableDaysCount,
    absentDays,
    presentDays,
    totalUnits,
    effectiveBaseSalary: Math.round(effectiveBaseSalary || 0),
    dailyDeductionRate: Math.round((dailyDeductionRate || 0) * 100) / 100,
    totalDeduction: Math.round(totalDeduction || 0),
    calculatedPayable: Math.round(calculatedPayable || 0),
    breakdownSummary,
    isPaid: Boolean(paymentRecord),
    paymentRecord,
  };
}
