'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { createClient } from '@/lib/supabase/client';
import { Worker, HelperRole, DeductionMode, BillingType } from '@/lib/types';
import { formatDateISO } from '@/lib/utils/calculations';
import { validateName, validateIsoDate, validateNumericInput } from '@/lib/utils/validation';
import { sanitizeErrorMessage } from '@/lib/utils/errorHandling';
import {
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  X,
  Save,
  RefreshCw,
  Calculator,
  Shield,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const ROLES: HelperRole[] = ['Cook', 'Maid', 'Milkman', 'Ironing', 'Driver', 'Newspaper', 'Other'];

export default function HelpersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { workers, isInitialLoaded, refreshData, setWorkers } = useData();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState<HelperRole>('Maid');
  const [customRoleName, setCustomRoleName] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('salary');
  const [otherBillingBasis, setOtherBillingBasis] = useState<'attendance' | 'unit'>('attendance');

  const [joiningDate, setJoiningDate] = useState(formatDateISO(new Date()));
  const [monthlySalary, setMonthlySalary] = useState('');
  const [deductionMode, setDeductionMode] = useState<DeductionMode>('auto');
  const [manualDeductionAmount, setManualDeductionAmount] = useState('');

  const [dailyRate, setDailyRate] = useState('');
  const [litresPerDay, setLitresPerDay] = useState('');
  const [costPerLitre, setCostPerLitre] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');

  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle auto setting of billing type based on role selection
  const handleRoleChange = (selectedRole: HelperRole) => {
    setRole(selectedRole);
    if (selectedRole === 'Newspaper') {
      setBillingType('daily_rate');
    } else if (selectedRole === 'Milkman') {
      setBillingType('consumption');
    } else if (selectedRole === 'Ironing') {
      setBillingType('per_unit_log');
    } else if (selectedRole === 'Other') {
      setBillingType(otherBillingBasis === 'attendance' ? 'salary' : 'per_unit_log');
    } else {
      setBillingType('salary');
    }
  };

  const handleOtherBillingBasisChange = (basis: 'attendance' | 'unit') => {
    setOtherBillingBasis(basis);
    setBillingType(basis === 'attendance' ? 'salary' : 'per_unit_log');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const openAddModal = () => {
    setEditingWorker(null);
    setName('');
    setRole('Maid');
    setCustomRoleName('');
    setBillingType('salary');
    setOtherBillingBasis('attendance');
    setJoiningDate(formatDateISO(new Date()));
    setMonthlySalary('');
    setDeductionMode('auto');
    setManualDeductionAmount('');
    setDailyRate('');
    setLitresPerDay('');
    setCostPerLitre('');
    setCostPerUnit('');
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (w: Worker) => {
    setEditingWorker(w);
    setName(w.name);
    setRole(w.role);
    setCustomRoleName(w.custom_role_name || '');
    setBillingType(w.billing_type || 'salary');
    setOtherBillingBasis(w.billing_type === 'per_unit_log' ? 'unit' : 'attendance');
    setJoiningDate(w.joining_date);
    setMonthlySalary(w.monthly_salary ? w.monthly_salary.toString() : '');
    setDeductionMode(w.deduction_mode || 'auto');
    setManualDeductionAmount(w.manual_deduction_amount ? w.manual_deduction_amount.toString() : '');
    setDailyRate(w.daily_rate ? w.daily_rate.toString() : '');
    setLitresPerDay(w.litres_per_day ? w.litres_per_day.toString() : '');
    setCostPerLitre(w.cost_per_litre ? w.cost_per_litre.toString() : '');
    setCostPerUnit(w.cost_per_unit ? w.cost_per_unit.toString() : '');
    setIsActive(w.is_active);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameVal = validateName(name, 'Staff Name');
    if (!nameVal.isValid) {
      setErrorMsg(nameVal.error || 'Invalid name.');
      return;
    }

    const dateVal = validateIsoDate(joiningDate, 'Joining Date');
    if (!dateVal.isValid) {
      setErrorMsg(dateVal.error || 'Invalid joining date.');
      return;
    }

    if (role === 'Other') {
      const customRoleVal = validateName(customRoleName, 'Custom Role Name');
      if (!customRoleVal.isValid) {
        setErrorMsg(customRoleVal.error || 'Invalid role name.');
        return;
      }
    }

    // Validate role specific numeric fields
    let salaryNum = 0;
    let manualAmtNum: number | null = null;
    let dailyRateNum: number | null = null;
    let litresNum: number | null = null;
    let costPerLitreNum: number | null = null;
    let costPerUnitNum: number | null = null;

    if (billingType === 'salary') {
      const salVal = validateNumericInput(monthlySalary, { fieldName: 'Monthly Salary', min: 0, max: 1000000 });
      if (!salVal.isValid) {
        setErrorMsg(salVal.error || 'Invalid monthly salary.');
        return;
      }
      salaryNum = Number(monthlySalary);

      if (deductionMode === 'manual') {
        const manVal = validateNumericInput(manualDeductionAmount, { fieldName: 'Manual Deduction Amount', min: 0, max: 50000 });
        if (!manVal.isValid) {
          setErrorMsg(manVal.error || 'Invalid manual deduction amount.');
          return;
        }
        manualAmtNum = Number(manualDeductionAmount);
      }
    } else if (billingType === 'daily_rate') {
      const dailyVal = validateNumericInput(dailyRate, { fieldName: 'Cost per day', min: 1, max: 100000, allowZero: false });
      if (!dailyVal.isValid) {
        setErrorMsg(dailyVal.error || 'Invalid cost per day.');
        return;
      }
      dailyRateNum = Number(dailyRate);
    } else if (billingType === 'consumption') {
      const litVal = validateNumericInput(litresPerDay, { fieldName: 'Litres per day', min: 0.1, max: 100, allowZero: false });
      if (!litVal.isValid) {
        setErrorMsg(litVal.error || 'Invalid litres per day.');
        return;
      }
      const cplVal = validateNumericInput(costPerLitre, { fieldName: 'Cost per litre', min: 0.1, max: 1000, allowZero: false });
      if (!cplVal.isValid) {
        setErrorMsg(cplVal.error || 'Invalid cost per litre.');
        return;
      }
      litresNum = Number(litresPerDay);
      costPerLitreNum = Number(costPerLitre);
    } else if (billingType === 'per_unit_log') {
      const cpuVal = validateNumericInput(costPerUnit, { fieldName: 'Cost per unit/piece', min: 0.1, max: 10000, allowZero: false });
      if (!cpuVal.isValid) {
        setErrorMsg(cpuVal.error || 'Invalid cost per unit.');
        return;
      }
      costPerUnitNum = Number(costPerUnit);
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const supabase = createClient();

    const payload = {
      name: name.trim(),
      role,
      custom_role_name: role === 'Other' ? customRoleName.trim() : null,
      billing_type: billingType,
      joining_date: joiningDate,
      monthly_salary: salaryNum,
      deduction_mode: deductionMode,
      manual_deduction_amount: manualAmtNum,
      daily_rate: dailyRateNum,
      litres_per_day: litresNum,
      cost_per_litre: costPerLitreNum,
      cost_per_unit: costPerUnitNum,
      is_active: isActive,
    };

    try {
      if (editingWorker) {
        // Update
        const { error } = await supabase
          .from('workers')
          .update(payload)
          .eq('id', editingWorker.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('workers').insert({
          ...payload,
          user_id: user!.id,
        });

        if (error) throw error;
      }

      setIsModalOpen(false);
      await refreshData();
    } catch (err: any) {
      setErrorMsg(sanitizeErrorMessage(err, 'Failed to save staff member details.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (workerId: string) => {
    if (!confirm('Are you sure you want to delete this staff member? All attendance and payment history will be deleted.')) {
      return;
    }

    const supabase = createClient();
    try {
      const { error } = await supabase.from('workers').delete().eq('id', workerId);
      if (error) throw error;
      setIsModalOpen(false);
      await refreshData();
    } catch (err: any) {
      alert(sanitizeErrorMessage(err, 'Failed to delete worker details.'));
    }
  };

  const toggleWorkerStatus = async (w: Worker) => {
    const supabase = createClient();
    try {
      const newStatus = !w.is_active;
      setWorkers((prev) =>
        prev.map((item) => (item.id === w.id ? { ...item, is_active: newStatus } : item))
      );

      const { error } = await supabase
        .from('workers')
        .update({ is_active: newStatus })
        .eq('id', w.id);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update worker status:', err);
      await refreshData();
    }
  };

  if (authLoading || (!isInitialLoaded && workers.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#717975]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#183C32] mb-2" />
        <p className="text-sm font-medium">Loading household staff...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="px-4 pt-3 pb-24 space-y-5">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-[#1A1C1B]">Household Staff ({workers.length})</h1>
          <p className="text-[11px] text-[#717975] font-medium">
            Manage roles, salaries, rates & billing models
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-2xl bg-[#183C32] hover:bg-[#00261D] text-white text-xs font-black shadow-stitch flex items-center space-x-1.5 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#DDEFE5]" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Staff List Cards */}
      <div className="space-y-3.5">
        {workers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#E2E3E0] shadow-stitch text-center">
            <div className="w-14 h-14 rounded-3xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center mx-auto mb-3 shadow-emerald-glow">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-[#1A1C1B] text-base">No Staff Configured</h3>
            <p className="text-xs text-[#717975] mt-1 max-w-xs mx-auto font-medium">
              Add your first staff member to set up role-specific billing and attendance tracking.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-5 py-3 rounded-2xl bg-[#183C32] text-white text-xs font-black shadow-stitch inline-flex items-center space-x-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Staff Member</span>
            </button>
          </div>
        ) : (
          workers.map((worker) => {
            const roleName = worker.role === 'Other' ? worker.custom_role_name || 'Other' : worker.role;
            const bType = worker.billing_type || 'salary';

            return (
              <div
                key={worker.id}
                onClick={() => router.push(`/helpers/${worker.id}`)}
                className={`bg-white rounded-3xl p-4.5 border transition-all shadow-stitch flex flex-col justify-between space-y-3 cursor-pointer group hover:border-[#183C32]/40 active:scale-[0.98] ${
                  !worker.is_active ? 'opacity-65 bg-[#EEEEEC]/40 border-[#E2E3E0]' : 'border-[#E2E3E0]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base ${
                        worker.is_active
                          ? 'bg-[#DDEFE5] text-[#183C32]'
                          : 'bg-[#EEEEEC] text-[#717975]'
                      }`}
                    >
                      {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-black text-[#1A1C1B] text-base group-hover:text-[#183C32] transition-colors truncate">
                          {worker.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEEEEC] text-[#52625A] shrink-0">
                          {roleName}
                        </span>
                        {!worker.is_active && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFDAD6] text-[#93000A] shrink-0">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#717975] font-medium mt-0.5">
                        Joined:{' '}
                        {new Date(worker.joining_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(worker)}
                      className="p-2 rounded-2xl text-[#717975] hover:text-[#183C32] hover:bg-[#DDEFE5]/50 transition-colors"
                      title="Edit Worker"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleWorkerStatus(worker)}
                      className={`p-2 rounded-2xl transition-colors ${
                        worker.is_active
                          ? 'text-[#183C32] hover:bg-[#FFDAD6]/30 hover:text-[#BA1A1A]'
                          : 'text-[#717975] hover:bg-[#DDEFE5]/50 hover:text-[#183C32]'
                      }`}
                      title={worker.is_active ? 'Deactivate Worker' : 'Activate Worker'}
                    >
                      {worker.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <ChevronRight className="w-5 h-5 text-[#717975] ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Salary & Billing Details Pill */}
                <div className="pt-2.5 border-t border-[#E2E3E0] flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#717975] font-medium">Billing Model:</span>
                    <span className="font-bold text-[#1A1C1B] capitalize">{bType.replace('_', ' ')}</span>
                  </div>

                  <div className="px-3 py-1 rounded-full bg-[#DDEFE5] text-[#183C32] font-black text-xs">
                    {bType === 'salary' && `₹${worker.monthly_salary.toLocaleString('en-IN')}/mo`}
                    {bType === 'daily_rate' && `₹${worker.daily_rate}/day`}
                    {bType === 'consumption' && `${worker.litres_per_day} L @ ₹${worker.cost_per_litre}/L`}
                    {bType === 'per_unit_log' && `₹${worker.cost_per_unit}/piece`}
                  </div>
                </div>
              </div>
            );
          })
        )}

      </div>

      {/* Add / Edit Worker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-stitch-lg border border-[#E2E3E0] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E3E0] mb-4">
              <h2 className="text-lg font-bold text-[#1A1C1B]">
                {editingWorker ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#EEEEEC] text-[#717975] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-[#FFDAD6] text-[#93000A] text-xs font-medium border border-[#BA1A1A]/20">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar, Sunita Devi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as HelperRole)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                  />
                </div>
              </div>

              {/* Free-text Role Name for 'Other' */}
              {role === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required={role === 'Other'}
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    placeholder="e.g. Gardener, Car Cleaner, Security Guard"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                  />
                </div>
              )}

              {/* Billing Basis selector for 'Other' */}
              {role === 'Other' && (
                <div className="p-3.5 rounded-2xl bg-[#F9F9F7] border border-[#E2E3E0] space-y-2">
                  <label className="block text-xs font-semibold text-[#183C32] uppercase tracking-wider">
                    Select Billing Basis *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOtherBillingBasisChange('attendance')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                        otherBillingBasis === 'attendance'
                          ? 'bg-[#183C32] text-white border-[#183C32]'
                          : 'bg-white text-[#52625A] border-[#E2E3E0]'
                      }`}
                    >
                      Fixed Schedule
                      <span className="block text-[10px] opacity-80 font-normal">Monthly Salary</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOtherBillingBasisChange('unit')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                        otherBillingBasis === 'unit'
                          ? 'bg-[#183C32] text-white border-[#183C32]'
                          : 'bg-white text-[#52625A] border-[#E2E3E0]'
                      }`}
                    >
                      Per-Visit / Unit
                      <span className="block text-[10px] opacity-80 font-normal">Service Log Entries</span>
                    </button>
                  </div>
                </div>
              )}

              {/* DYNAMIC BILLING INPUT FIELDS BASED ON BILLING TYPE */}

              {/* 1. NEWSPAPER / DAILY RATE ROLE */}
              {billingType === 'daily_rate' && (
                <div className="p-4 rounded-2xl bg-[#DDEFE5]/40 border border-[#183C32]/20 space-y-2">
                  <label className="block text-xs font-semibold text-[#183C32] uppercase tracking-wider">
                    Cost Per Day (₹) *
                  </label>
                  <input
                    type="number"
                    required={billingType === 'daily_rate'}
                    min="1"
                    step="1"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                  />
                  <p className="text-[11px] text-[#52625A]">
                    Monthly total auto-calculates as: <code>Cost per day × Present days</code>
                  </p>
                </div>
              )}

              {/* 2. MILKMAN / CONSUMPTION ROLE */}
              {billingType === 'consumption' && (
                <div className="p-4 rounded-2xl bg-[#DDEFE5]/40 border border-[#183C32]/20 space-y-3">
                  <span className="block text-xs font-semibold text-[#183C32] uppercase tracking-wider">
                    Daily Milk Consumption Setup *
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#414845] mb-1">
                        Litres Per Day *
                      </label>
                      <input
                        type="number"
                        required={billingType === 'consumption'}
                        min="0.1"
                        step="0.1"
                        value={litresPerDay}
                        onChange={(e) => setLitresPerDay(e.target.value)}
                        placeholder="e.g. 1.5"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#414845] mb-1">
                        Cost Per Litre (₹) *
                      </label>
                      <input
                        type="number"
                        required={billingType === 'consumption'}
                        min="1"
                        step="1"
                        value={costPerLitre}
                        onChange={(e) => setCostPerLitre(e.target.value)}
                        placeholder="e.g. 60"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#52625A]">
                    Daily cost = <code>Litres × Rate</code>. Monthly total auto-calculates on present days.
                  </p>
                </div>
              )}

              {/* 3. IRONING / PER UNIT LOG ROLE */}
              {billingType === 'per_unit_log' && (
                <div className="p-4 rounded-2xl bg-[#DDEFE5]/40 border border-[#183C32]/20 space-y-2">
                  <label className="block text-xs font-semibold text-[#183C32] uppercase tracking-wider">
                    Cost Per Piece / Pair of Clothes (₹) *
                  </label>
                  <input
                    type="number"
                    required={billingType === 'per_unit_log'}
                    min="1"
                    step="1"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    placeholder="e.g. 10 or 20"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                  />
                  <p className="text-[11px] text-[#52625A]">
                    Log drop-offs whenever clothes are given. Monthly total sum of log entries.
                  </p>
                </div>
              )}

              {/* 4. COOK / MAID / SALARY ROLE */}
              {billingType === 'salary' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                      Monthly Base Salary (₹) *
                    </label>
                    <input
                      type="number"
                      required={billingType === 'salary'}
                      min="0"
                      step="100"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value)}
                      placeholder="e.g. 8000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F9F9F7] border border-[#E2E3E0] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#183C32] uppercase tracking-wider flex items-center space-x-1">
                        <Calculator className="w-4 h-4 text-[#183C32]" />
                        <span>Absence Deduction Rule</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeductionMode('auto')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                          deductionMode === 'auto'
                            ? 'bg-[#183C32] text-white border-[#183C32] shadow-sm'
                            : 'bg-white text-[#52625A] border-[#E2E3E0]'
                        }`}
                      >
                        Auto Mode
                        <span className="block text-[10px] opacity-80 font-normal">Salary ÷ Month Days</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeductionMode('manual')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                          deductionMode === 'manual'
                            ? 'bg-[#183C32] text-white border-[#183C32] shadow-sm'
                            : 'bg-white text-[#52625A] border-[#E2E3E0]'
                        }`}
                      >
                        Manual Mode
                        <span className="block text-[10px] opacity-80 font-normal">Fixed Flat Amount</span>
                      </button>
                    </div>

                    {deductionMode === 'manual' && (
                      <div className="pt-2">
                        <label className="block text-xs font-medium text-[#414845] mb-1">
                          Fixed Flat Deduction Amount Per Day (₹) *
                        </label>
                        <input
                          type="number"
                          required={deductionMode === 'manual'}
                          min="0"
                          step="10"
                          value={manualDeductionAmount}
                          onChange={(e) => setManualDeductionAmount(e.target.value)}
                          placeholder="e.g. 250"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {editingWorker && (
                <div className="flex items-center justify-between pt-2">
                  <label className="text-xs font-semibold text-[#414845] uppercase tracking-wider">
                    Staff Active Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-[#DDEFE5] text-[#183C32]' : 'bg-[#FFDAD6] text-[#93000A]'
                    }`}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              )}

              <div className="pt-4 flex items-center space-x-3">
                {editingWorker && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingWorker.id)}
                    className="p-3 rounded-xl bg-[#FFDAD6]/50 text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors"
                    title="Delete Staff Member"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#183C32] hover:bg-[#00261D] text-white font-semibold text-sm shadow-stitch flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-70"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : editingWorker ? 'Update Staff' : 'Add Staff'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
