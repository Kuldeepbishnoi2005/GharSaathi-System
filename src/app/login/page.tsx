'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';

import { validateEmail, validatePassword } from '@/lib/utils/validation';
import { sanitizeErrorMessage } from '@/lib/utils/errorHandling';

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, loading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const submittingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle countdown timer for rate limiting
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (mounted && user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router, mounted]);

  const validateForm = (): boolean => {
    const emailRes = validateEmail(email);
    if (!emailRes.isValid) {
      setErrorMsg(emailRes.error || 'Invalid email.');
      return false;
    }

    const passRes = validatePassword(password);
    if (!passRes.isValid) {
      setErrorMsg(passRes.error || 'Invalid password.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submittingRef.current || isSubmitting || countdown > 0) return;

    if (!validateForm()) return;

    setErrorMsg('');
    setIsSubmitting(true);
    submittingRef.current = true;

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email.trim(), password);
        if (error) {
          if (error.message.toLowerCase().includes('rate limit') || (error as any).status === 429) {
            setCountdown(60);
            throw new Error('Supabase email rate limit reached. Please wait 60 seconds or use an existing test account.');
          }
          throw error;
        }
      } else {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          if (error.message.toLowerCase().includes('rate limit') || (error as any).status === 429) {
            setCountdown(60);
            throw new Error('Authentication rate limit reached. Please wait 60 seconds before trying again.');
          }
          throw error;
        }
      }
      router.push('/');
    } catch (err: any) {
      setErrorMsg(sanitizeErrorMessage(err, 'Authentication failed. Please check your credentials and try again.'));
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleDemoAccess = async () => {
    if (submittingRef.current || isSubmitting || countdown > 0) return;

    setEmail('test@gharsaathi.com');
    setPassword('Password123!');
    setIsSubmitting(true);
    submittingRef.current = true;
    setErrorMsg('');

    try {
      const { error } = await signInWithEmail('test@gharsaathi.com', 'Password123!');
      if (error) {
        // If demo user does not exist yet, create it on the fly
        const signUpRes = await signUpWithEmail('test@gharsaathi.com', 'Password123!');
        if (signUpRes.error) {
          if (signUpRes.error.message.toLowerCase().includes('rate limit') || (signUpRes.error as any).status === 429) {
            setCountdown(60);
            throw new Error('Authentication rate limit reached. Please wait 60 seconds before trying again.');
          }
          throw signUpRes.error;
        }
      }
      router.push('/');
    } catch (err: any) {
      setErrorMsg(sanitizeErrorMessage(err, 'Demo login failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center py-6 text-[#717975]">
        <div className="w-10 h-10 rounded-2xl bg-[#183C32] text-[#DDEFE5] flex items-center justify-center mb-3 animate-pulse">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold">Loading GharSaathi Login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-stitch border border-[#E2E3E0] max-w-sm mx-auto w-full">
        {/* Brand Banner */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#183C32] text-[#DDEFE5] flex items-center justify-center mb-4 shadow-stitch">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1C1B]">GharSaathi</h1>
          <p className="text-xs text-[#717975] mt-1">
            Household Staff Attendance & Salary Ledger
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-xl bg-[#FFDAD6] text-[#93000A] text-xs font-medium border border-[#BA1A1A]/20 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {countdown > 0 && (
          <div className="mb-6 p-3 rounded-xl bg-[#FEF3C7] text-[#92400E] text-xs font-medium border border-[#F59E0B]/30 flex items-center justify-between">
            <span>Rate limit cooldown active</span>
            <span className="font-bold text-sm bg-[#F59E0B] text-white px-2 py-0.5 rounded-md">
              {countdown}s
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717975]" />
              <input
                type="email"
                required
                disabled={isSubmitting || countdown > 0}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] placeholder-[#717975] focus:outline-none focus:ring-2 focus:ring-[#183C32] focus:bg-white transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#414845] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717975]" />
              <input
                type="password"
                required
                disabled={isSubmitting || countdown > 0}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] text-sm text-[#1A1C1B] placeholder-[#717975] focus:outline-none focus:ring-2 focus:ring-[#183C32] focus:bg-white transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || countdown > 0}
            className="w-full py-3.5 px-4 rounded-xl bg-[#183C32] hover:bg-[#00261D] text-white font-semibold text-sm shadow-stitch flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            <span>
              {isSubmitting
                ? 'Please wait...'
                : countdown > 0
                ? `Wait ${countdown}s`
                : isSignUp
                ? 'Create Account'
                : 'Sign In'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#E2E3E0] space-y-3 text-center">
          <button
            type="button"
            disabled={isSubmitting || countdown > 0}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-xs text-[#52625A] hover:text-[#183C32] font-medium transition-colors block w-full disabled:opacity-50"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>

          <button
            type="button"
            disabled={isSubmitting || countdown > 0}
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 rounded-xl bg-[#DDEFE5] hover:bg-[#cbe6d7] text-[#183C32] font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? 'Authenticating...'
                : countdown > 0
                ? `Wait ${countdown}s`
                : 'One-Click Demo Access'}
            </span>
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-[#F9F9F7] border border-[#E2E3E0] flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-[#183C32] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#52625A] leading-tight">
            <strong>Direct Access:</strong> No email confirmation required. You remain logged in on this device until you sign out.
          </p>
        </div>
      </div>
    </div>
  );
}
