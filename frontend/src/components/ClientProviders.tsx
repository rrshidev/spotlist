'use client';

import { Suspense, ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { MapProvider } from '@/contexts/MapContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Navbar } from '@/components/Navbar';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Toaster } from '@/components/Toaster';
import { Loader2 } from 'lucide-react';

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
    </div>
  );
}

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <ToastProvider>
        <AuthProvider>
          <MapProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <InstallPrompt />
            <Toaster />
          </MapProvider>
        </AuthProvider>
      </ToastProvider>
    </Suspense>
  );
}