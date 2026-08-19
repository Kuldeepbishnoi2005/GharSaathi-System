'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, Share } from 'lucide-react';

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Detect standalone mode (already installed)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Detect iOS device
    const ua = window.navigator.userAgent;
    const isIosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!mounted || isStandalone || dismissed) {
    return null;
  }

  // If neither Chrome install prompt nor iOS device is active, don't show
  if (!deferredPrompt && !isIos) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setDismissed(true);
      }
    } else if (isIos) {
      setShowIosGuide(!showIosGuide);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#183C32] to-[#0D241E] text-white rounded-3xl p-4 shadow-card-glow border border-[#183C32]/40 relative overflow-hidden mb-4 animate-sheet-up">
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#DDEFE5]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-[#DDEFE5] text-[#183C32] flex items-center justify-center font-black text-lg shrink-0 shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#DDEFE5] bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                PWA Mobile App
              </span>
              <Sparkles className="w-3 h-3 text-[#10B981]" />
            </div>
            <h4 className="font-extrabold text-sm text-white mt-0.5">
              Install GharSaathi App
            </h4>
            <p className="text-[11px] text-[#DDEFE5]/80 font-medium mt-0.5">
              Add to Home Screen for 1-tap access with offline support
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 pt-3 border-t border-white/15 flex items-center justify-between relative z-10">
        <span className="text-[11px] text-[#DDEFE5]/70 font-semibold">
          Fast • Native feel • No App Store needed
        </span>

        <button
          onClick={handleInstallClick}
          className="px-4 py-2 rounded-2xl bg-[#DDEFE5] text-[#183C32] hover:bg-white text-xs font-black transition-all shadow-md flex items-center space-x-1.5 active:scale-95 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#183C32]" />
          <span>{isIos ? 'How to Install' : 'Install App'}</span>
        </button>
      </div>

      {showIosGuide && isIos && (
        <div className="mt-3 p-3 rounded-2xl bg-white/10 text-xs text-[#DDEFE5] border border-white/15 space-y-1.5 animate-fadeIn">
          <p className="font-bold flex items-center space-x-1 text-white">
            <Share className="w-3.5 h-3.5 text-[#10B981]" />
            <span>To install on iPhone/iPad:</span>
          </p>
          <ol className="list-decimal list-inside text-[11px] space-y-1 text-[#DDEFE5]/90">
            <li>Tap the <strong>Share</strong> icon in Safari toolbar.</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong> at top right.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
