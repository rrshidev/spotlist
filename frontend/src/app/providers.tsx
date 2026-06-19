'use client';

import { useState, useEffect, ReactNode, Component } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { MapProvider } from '@/contexts/MapContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { Navbar } from '@/components/Navbar';
import { InstallPrompt } from '@/components/InstallPrompt';
import { YandexMetrica } from '@/components/YandexMetrica';
import { UTMTracker } from '@/components/UTMTracker';
import { Toaster } from '@/components/Toaster';
import { Loader2 } from 'lucide-react';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h1>
            <p className="text-white/60">Try refreshing the page</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#39ff14] text-black rounded-lg"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <MapProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <InstallPrompt />
            <UTMTracker />
            <YandexMetrica />
            <Toaster />
          </MapProvider>
        </AuthProvider>
      </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
