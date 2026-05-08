'use client';

import { ReactNode, useState, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { MapProvider } from '@/contexts/MapContext';
import { ToastProvider } from '@/contexts/ToastContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <MapProvider>
          {children}
        </MapProvider>
      </AuthProvider>
    </ToastProvider>
  );
}