'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let capturedEvent: BeforeInstallPromptEvent | null =
  typeof window !== 'undefined' && (window as any).__pwaPrompt
    ? (window as any).__pwaPrompt
    : null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    capturedEvent = e as BeforeInstallPromptEvent;
    (window as any).__pwaPrompt = capturedEvent;
  });
}

export function InstallPrompt() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(capturedEvent);
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    setIsApp(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => setIsApp(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      capturedEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(capturedEvent);
    };

    const handleInstalled = () => {
      capturedEvent = null;
      setDeferredPrompt(null);
      setIsApp(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      capturedEvent = null;
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    capturedEvent = null;
    setDeferredPrompt(null);
  };

  if (isApp || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6">
      <div className="max-w-lg mx-auto bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-4 shadow-2xl shadow-black/50 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#39ff14] to-[#00f5ff] flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{t('installPrompt.title')}</p>
          <p className="text-white/50 text-xs mt-0.5">{t('installPrompt.subtitle')}</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#39ff14] to-[#00f5ff] text-black font-semibold text-sm hover:opacity-90 transition-opacity flex-shrink-0"
        >
          {t('installPrompt.install')}
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/40 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
