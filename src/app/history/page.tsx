'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { createClient } from '@/lib/supabase/client';
import { Worker, AttendanceException, VacationPeriod } from '@/lib/types';
import { formatDateISO } from '@/lib/utils/calculations';
import { validateDateRange, validateNoteText } from '@/lib/utils/validation';
import { sanitizeErrorMessage } from '@/lib/utils/errorHandling';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Palmtree,
  Plus,
  Trash2,
  Clock,
  X,
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    workers: allWorkers,
    monthExceptions,
    vacationPeriods,
    isInitialLoaded,
    setMonthExceptions,
    setVacationPeriods,
    refreshData,
  } = useData();

  const workers = allWorkers.filter((w) => w.is_active);

  const todayStr = formatDateISO(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState<'attendance' | 'vacations'>('attendance');

  const [dateExceptions, setDateExceptions] = useState<AttendanceException[]>([]);
  const [togglingWorkerId, setTogglingWorkerId] = useState<string | null>(null);

  // Note editing state
  const [noteWorkerId, setNoteWorkerId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Vacation Modal state
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [vacationStart, setVacationStart] = useState(todayStr);
  const [vacationEnd, setVacationEnd] = useState(todayStr);
  const [vacationNote, setVacationNote] = useState('');
  const [isSubmittingVacation, setIsSubmittingVacation] = useState(false);

  // Fetch exceptions for selectedDate if not in monthExceptions
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    const supabase = createClient();
    async function loadDateExceptions() {
      // Check if selectedDate is already in monthExceptions
      const cached = monthExceptions.filter((ex) => ex.date === selectedDate);
      setDateExceptions(cached);

      // If selectedDate is not cached in current month, fetch directly
      const { data } = await supabase
        .from('attendance_exceptions')
        .select('*')
        .eq('date', selectedDate);
      if (data) {
        setDateExceptions(data);
      }
    }

    loadDateExceptions();
  }, [user, authLoading, selectedDate, monthExceptions, router]);

  // Derived exceptions list for view
  const exceptionsForDate = dateExceptions;

  // Backdating toggle logic
  const toggleAttendanceOnDate = async (workerId: string) => {
    if (togglingWorkerId) return;

    setTogglingWorkerId(workerId);

    const supabase = createClient();
    const existingEx = exceptionsForDate.find((ex) => ex.worker_id === workerId);

    if (existingEx) {
      // Mark Present -> Delete exception
      setDateExceptions((prev: AttendanceException[]) => prev.filter((ex) => ex.worker_id !== workerId));
      setMonthExceptions((prev: AttendanceException[]) => prev.filter((ex) => ex.id !== existingEx.id));
      const { error } = await supabase
        .from('attendance_exceptions')
        .delete()
        .eq('id', existingEx.id);

      if (error) {
        console.error('Failed to update past attendance:', error);
        setDateExceptions((prev: AttendanceException[]) => [...prev, existingEx]);
        setMonthExceptions((prev: AttendanceException[]) => [...prev, existingEx]);
      }
    } else {
      // Mark Absent -> Insert exception for selectedDate
      const tempId = `temp-${Date.now()}`;
      const newEx: AttendanceException = {
        id: tempId,
        worker_id: workerId,
        date: selectedDate,
        status: 'absent',
      };

      setDateExceptions((prev: AttendanceException[]) => [...prev, newEx]);
      setMonthExceptions((prev: AttendanceException[]) => [...prev, newEx]);

      const { data, error } = await supabase
        .from('attendance_exceptions')
        .insert({
          worker_id: workerId,
          date: selectedDate,
          status: 'absent',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to insert past attendance exception:', error);
        setDateExceptions((prev: AttendanceException[]) => prev.filter((ex) => ex.id !== tempId));
        setMonthExceptions((prev: AttendanceException[]) => prev.filter((ex) => ex.id !== tempId));
      } else if (data) {
        setDateExceptions((prev: AttendanceException[]) =>
          prev.map((ex) => (ex.id === tempId ? (data as AttendanceException) : ex))
        );
        setMonthExceptions((prev: AttendanceException[]) =>
          prev.map((ex) => (ex.id === tempId ? (data as AttendanceException) : ex))
        );
      }
    }

    setTogglingWorkerId(null);
  };

  const saveNote = async (workerId: string) => {
    const existingEx = exceptionsForDate.find((ex) => ex.worker_id === workerId);
    if (!existingEx) return;

    const noteVal = validateNoteText(noteText, 250);
    if (!noteVal.isValid) {
      alert(noteVal.error || 'Invalid note.');
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('attendance_exceptions')
        .update({ note: noteText.trim() })
        .eq('id', existingEx.id);

      if (error) throw error;
      setDateExceptions((prev: AttendanceException[]) =>
        prev.map((ex) => (ex.id === existingEx.id ? { ...ex, note: noteText.trim() } : ex))
      );
      setMonthExceptions((prev: AttendanceException[]) =>
        prev.map((ex) => (ex.id === existingEx.id ? { ...ex, note: noteText.trim() } : ex))
      );
      setNoteWorkerId(null);
    } catch (err) {
      console.error('Error saving note:', err);
      alert(sanitizeErrorMessage(err, 'Failed to save note.'));
    }
  };

  // Add new vacation period
  const handleAddVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rangeVal = validateDateRange(vacationStart, vacationEnd);
    if (!rangeVal.isValid) {
      alert(rangeVal.error || 'Invalid date range for vacation.');
      return;
    }

    const noteVal = validateNoteText(vacationNote, 250);
    if (!noteVal.isValid) {
      alert(noteVal.error || 'Invalid note text.');
      return;
    }

    setIsSubmittingVacation(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('vacation_periods')
        .insert({
          user_id: user?.id,
          start_date: vacationStart,
          end_date: vacationEnd,
          note: vacationNote.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setVacationPeriods((prev) => [data as VacationPeriod, ...prev]);
      }
      setIsVacationModalOpen(false);
      setVacationStart(todayStr);
      setVacationEnd(todayStr);
      setVacationNote('');
    } catch (err: any) {
      alert(sanitizeErrorMessage(err, 'Failed to add vacation period. Please try again.'));
    } finally {
      setIsSubmittingVacation(false);
    }
  };

  // Delete vacation period
  const handleDeleteVacation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vacation period?')) return;
    const supabase = createClient();

    try {
      const { error } = await supabase.from('vacation_periods').delete().eq('id', id);
      if (error) throw error;
      setVacationPeriods((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      alert(sanitizeErrorMessage(err, 'Could not delete vacation period. Please try again.'));
    }
  };

  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDateStr = formatDateISO(d);

    // Block future dates
    if (newDateStr > todayStr) return;
    setSelectedDate(newDateStr);
  };

  const isSelectedToday = selectedDate === todayStr;

  const displayDateObj = new Date(selectedDate);
  const formattedSelectedDate = displayDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Check if selected date is inside a vacation period
  const activeVacationForDate = vacationPeriods.find(
    (vp) => selectedDate >= vp.start_date && selectedDate <= vp.end_date
  );

  if (authLoading || (!isInitialLoaded && allWorkers.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#717975]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#183C32] mb-2" />
        <p className="text-sm font-medium">Loading history & vacation records...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#1A1C1B]">History & Vacation Tracker</h1>
        <p className="text-xs text-[#717975]">
          Daily attendance backdating & complete household vacation logs
        </p>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex p-1 rounded-2xl bg-[#EEEEEC] border border-[#E2E3E0]">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'attendance'
              ? 'bg-white text-[#183C32] shadow-stitch'
              : 'text-[#52625A] hover:text-[#1A1C1B]'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Attendance History</span>
        </button>

        <button
          onClick={() => setActiveTab('vacations')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'vacations'
              ? 'bg-white text-[#183C32] shadow-stitch'
              : 'text-[#52625A] hover:text-[#1A1C1B]'
          }`}
        >
          <Palmtree className="w-4 h-4 text-[#183C32]" />
          <span>Vacation History ({vacationPeriods.length})</span>
        </button>
      </div>

      {/* TAB 1: ATTENDANCE HISTORY */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          {/* Date Navigation Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E3E0] shadow-stitch flex items-center justify-between">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-2 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-[#1A1C1B] hover:bg-[#EEEEEC] transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-[#183C32]" />
                <input
                  type="date"
                  max={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="font-bold text-base text-[#1A1C1B] bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
              <span className="text-[11px] font-medium text-[#717975] mt-0.5">
                {isSelectedToday ? 'Today' : formattedSelectedDate}
              </span>
            </div>

            <button
              onClick={() => changeDateByDays(1)}
              disabled={isSelectedToday}
              className={`p-2 rounded-xl border transition-colors ${
                isSelectedToday
                  ? 'bg-[#EEEEEC] text-[#717975] border-[#E2E3E0] opacity-50 cursor-not-allowed'
                  : 'bg-[#F9F9F7] border-[#E2E3E0] text-[#1A1C1B] hover:bg-[#EEEEEC]'
              }`}
              title={isSelectedToday ? 'Future dates blocked' : 'Next Day'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Active Vacation Banner for Selected Date */}
          {activeVacationForDate ? (
            <div className="p-4 rounded-2xl bg-[#DDEFE5] border border-[#183C32]/20 text-[#183C32] space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <Palmtree className="w-5 h-5 shrink-0 text-[#183C32]" />
                <span>Household Vacation Active on {formattedSelectedDate}</span>
              </div>
              <p className="text-xs text-[#52625A]">
                Period: {activeVacationForDate.start_date} to {activeVacationForDate.end_date}
                {activeVacationForDate.note ? ` • "${activeVacationForDate.note}"` : ''}
              </p>
              <p className="text-[11px] font-semibold text-[#183C32]/90 pt-0.5">
                🏖️ Household vacation active. Absent staff will be deducted accordingly.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#EEEEEC] border border-[#E2E3E0] flex items-center space-x-2 text-xs text-[#52625A]">
              <AlertCircle className="w-4 h-4 text-[#183C32] shrink-0" />
              <span>Future dates are blocked. Backdating allowed for past dates.</span>
            </div>
          )}

          {/* Helper List for Selected Date */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#414845] uppercase tracking-wider">
              Staff Status on {formattedSelectedDate}
            </h2>

            {workers.map((worker) => {
              const ex = exceptionsForDate.find((e) => e.worker_id === worker.id);
              const isAbsent = Boolean(ex);
              const isProcessing = togglingWorkerId === worker.id;

              return (
                <div
                  key={worker.id}
                  className={`bg-white rounded-2xl p-4 border transition-all shadow-stitch space-y-3 ${
                    isAbsent ? 'border-[#BA1A1A]/30 bg-[#FFF5F5]/60' : 'border-[#E2E3E0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base ${
                          isAbsent ? 'bg-[#FFDAD6] text-[#93000A]' : 'bg-[#DDEFE5] text-[#183C32]'
                        }`}
                      >
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1A1C1B] text-base">{worker.name}</h3>
                        <p className="text-xs text-[#717975]">{worker.role}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => toggleAttendanceOnDate(worker.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm ${
                        isAbsent
                          ? 'bg-[#BA1A1A] text-white hover:bg-[#93000A]'
                          : 'bg-[#183C32] text-white hover:bg-[#00261D]'
                      } ${
                        isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
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
                  </div>

                  {/* Optional Note for Absence */}
                  {isAbsent && (
                    <div className="pt-2 border-t border-[#E2E3E0]">
                      {noteWorkerId === worker.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add reason for absence (e.g., Sick, Out of town)"
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#E2E3E0] bg-[#F9F9F7] focus:outline-none focus:ring-1 focus:ring-[#183C32]"
                          />
                          <button
                            onClick={() => saveNote(worker.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#183C32] text-white text-xs font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-[#717975]">
                          <span className="italic">
                            {ex?.note ? `Note: "${ex.note}"` : 'No absence note added'}
                          </span>
                          <button
                            onClick={() => {
                              setNoteWorkerId(worker.id);
                              setNoteText(ex?.note || '');
                            }}
                            className="text-[#183C32] font-semibold hover:underline flex items-center space-x-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{ex?.note ? 'Edit Note' : 'Add Note'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: VACATION HISTORY */}
      {activeTab === 'vacations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#414845] uppercase tracking-wider">
              Household Vacation Logs
            </h2>

            <button
              onClick={() => setIsVacationModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#183C32] text-white text-xs font-semibold hover:bg-[#00261D] flex items-center space-x-1 shadow-stitch transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log Vacation</span>
            </button>
          </div>

          {vacationPeriods.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#E2E3E0] text-center shadow-stitch space-y-2">
              <Palmtree className="w-10 h-10 text-[#183C32] mx-auto opacity-40" />
              <h3 className="font-bold text-[#1A1C1B] text-sm">No Vacations Logged Yet</h3>
              <p className="text-xs text-[#717975]">
                Going out of town? Tap "+ Log Vacation" above to pause attendance deductions during family trips.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vacationPeriods.map((vp) => {
                const isActiveNow = todayStr >= vp.start_date && todayStr <= vp.end_date;
                const isUpcoming = todayStr < vp.start_date;

                const start = new Date(vp.start_date);
                const end = new Date(vp.end_date);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                return (
                  <div
                    key={vp.id}
                    className="bg-white rounded-2xl p-4 border border-[#E2E3E0] shadow-stitch flex items-start justify-between"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center shrink-0 mt-0.5">
                        <Palmtree className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-[#1A1C1B] text-sm">
                            {new Date(vp.start_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            →{' '}
                            {new Date(vp.end_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isActiveNow
                                ? 'bg-[#DDEFE5] text-[#183C32]'
                                : isUpcoming
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : 'bg-[#EEEEEC] text-[#52625A]'
                            }`}
                          >
                            {isActiveNow ? 'Active Now' : isUpcoming ? 'Upcoming' : 'Completed'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-[#717975]">
                          <span className="font-semibold text-[#183C32]">
                            {daysCount} {daysCount === 1 ? 'Day' : 'Days'} Vacation
                          </span>
                          {vp.note && <span>• Reason: "{vp.note}"</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteVacation(vp.id)}
                      className="p-1.5 rounded-xl text-[#BA1A1A] hover:bg-[#FFDAD6]/40 transition-colors"
                      title="Delete Vacation Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LOG NEW VACATION MODAL */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-stitch-lg border border-[#E2E3E0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E3E0]">
              <div className="flex items-center space-x-2">
                <Palmtree className="w-5 h-5 text-[#183C32]" />
                <h3 className="text-base font-bold text-[#1A1C1B]">Log Household Vacation</h3>
              </div>
              <button
                onClick={() => setIsVacationModalOpen(false)}
                className="p-1 rounded-full text-[#717975] hover:bg-[#EEEEEC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#717975] mt-2">
              Staff attendance deductions will be paused automatically during these dates.
            </p>

            <form onSubmit={handleAddVacation} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={vacationStart}
                  onChange={(e) => setVacationStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  min={vacationStart}
                  value={vacationEnd}
                  onChange={(e) => setVacationEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1">
                  Reason / Note (Optional)
                </label>
                <input
                  type="text"
                  value={vacationNote}
                  onChange={(e) => setVacationNote(e.target.value)}
                  placeholder="e.g. Out of town for marriage"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-xs text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#183C32]"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVacationModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#E2E3E0] text-xs font-semibold text-[#52625A] hover:bg-[#F9F9F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVacation}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#183C32] text-white text-xs font-semibold hover:bg-[#00261D] disabled:opacity-50"
                >
                  {isSubmittingVacation ? 'Saving...' : 'Save Vacation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
