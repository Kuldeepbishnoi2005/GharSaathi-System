'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Worker, AttendanceException, VacationPeriod, ServiceLog, PaymentRecord } from '@/lib/types';
import { getMonthDateRange } from '@/lib/utils/calculations';

interface DataContextType {
  workers: Worker[];
  monthExceptions: AttendanceException[];
  vacationPeriods: VacationPeriod[];
  serviceLogs: ServiceLog[];
  payments: PaymentRecord[];
  isInitialLoaded: boolean;
  refreshData: () => Promise<void>;
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  setMonthExceptions: React.Dispatch<React.SetStateAction<AttendanceException[]>>;
  setVacationPeriods: React.Dispatch<React.SetStateAction<VacationPeriod[]>>;
  setServiceLogs: React.Dispatch<React.SetStateAction<ServiceLog[]>>;
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
}

const DataContext = createContext<DataContextType>({
  workers: [],
  monthExceptions: [],
  vacationPeriods: [],
  serviceLogs: [],
  payments: [],
  isInitialLoaded: false,
  refreshData: async () => {},
  setWorkers: () => {},
  setMonthExceptions: () => {},
  setVacationPeriods: () => {},
  setServiceLogs: () => {},
  setPayments: () => {},
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [monthExceptions, setMonthExceptions] = useState<AttendanceException[]>([]);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!user) {
      setWorkers([]);
      setMonthExceptions([]);
      setVacationPeriods([]);
      setServiceLogs([]);
      setPayments([]);
      setIsInitialLoaded(false);
      return;
    }

    const supabase = createClient();
    const now = new Date();
    const { startDate: monthStartDate, endDate: monthEndDate } = getMonthDateRange(now);

    try {
      const [wRes, exRes, vpRes, slRes, pRes] = await Promise.all([
        supabase.from('workers').select('*').order('name'),
        supabase.from('attendance_exceptions').select('*').gte('date', monthStartDate).lte('date', monthEndDate),
        supabase.from('vacation_periods').select('*').order('start_date', { ascending: false }),
        supabase.from('service_logs').select('*').gte('date', monthStartDate).lte('date', monthEndDate),
        supabase.from('payment_records').select('*'),
      ]);

      if (wRes.data) setWorkers(wRes.data);
      if (exRes.data) setMonthExceptions(exRes.data);
      if (vpRes.data) setVacationPeriods(vpRes.data);
      if (slRes.data) setServiceLogs(slRes.data);
      if (pRes.data) setPayments(pRes.data);
      setIsInitialLoaded(true);
    } catch (err) {
      console.error('Error loading global household data:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadAllData();
    }
  }, [user, authLoading, loadAllData]);

  const refreshData = async () => {
    await loadAllData();
  };

  return (
    <DataContext.Provider
      value={{
        workers,
        monthExceptions,
        vacationPeriods,
        serviceLogs,
        payments,
        isInitialLoaded,
        refreshData,
        setWorkers,
        setMonthExceptions,
        setVacationPeriods,
        setServiceLogs,
        setPayments,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
