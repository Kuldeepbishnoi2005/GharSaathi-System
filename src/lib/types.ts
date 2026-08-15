export type HelperRole = 'Cook' | 'Maid' | 'Milkman' | 'Ironing' | 'Driver' | 'Newspaper' | 'Other';
export type DeductionMode = 'auto' | 'manual';
export type AttendanceStatus = 'absent' | 'leave';
export type BillingType = 'salary' | 'daily_rate' | 'consumption' | 'per_unit_log';

export interface Worker {
  id: string;
  user_id: string;
  name: string;
  role: HelperRole;
  custom_role_name?: string | null;
  billing_type: BillingType;
  joining_date: string; // 'YYYY-MM-DD'
  is_active: boolean;
  // Salary model fields
  monthly_salary: number;
  deduction_mode: DeductionMode;
  manual_deduction_amount?: number | null;
  // Daily rate model fields (e.g. Newspaper)
  daily_rate?: number | null;
  // Consumption model fields (e.g. Milkman)
  litres_per_day?: number | null;
  cost_per_litre?: number | null;
  // Per unit log model fields (e.g. Ironing)
  cost_per_unit?: number | null;
  created_at?: string;
}

export interface AttendanceException {
  id: string;
  worker_id: string;
  date: string; // 'YYYY-MM-DD'
  status: AttendanceStatus;
  note?: string | null;
  created_at?: string;
}

export interface ServiceLog {
  id: string;
  worker_id: string;
  date: string; // 'YYYY-MM-DD'
  units: number;
  amount: number;
  note?: string | null;
  created_at?: string;
}

export interface VacationPeriod {
  id: string;
  user_id: string;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string; // 'YYYY-MM-DD'
  note?: string | null;
  created_at?: string;
}

export interface PaymentRecord {
  id: string;
  worker_id: string;
  month: string; // 'YYYY-MM-01'
  calculated_amount: number;
  final_amount: number;
  paid_on: string; // 'YYYY-MM-DD'
  created_at?: string;
}

export interface WorkerSalaryCalculation {
  worker: Worker;
  monthStr: string; // 'YYYY-MM'
  totalDaysInMonth: number;
  vacationDaysInMonth: number;
  applicableDays: number;
  absentDays: number;
  presentDays: number;
  totalUnits: number; // For per_unit_log
  effectiveBaseSalary: number;
  dailyDeductionRate: number;
  totalDeduction: number;
  calculatedPayable: number;
  breakdownSummary: string;
  isPaid: boolean;
  paymentRecord?: PaymentRecord;
}
