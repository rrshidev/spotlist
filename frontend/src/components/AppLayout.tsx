import { Suspense, ReactNode } from 'react';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import { Toaster } from '@/components/Toaster';
import { Loader2 } from 'lucide-react';

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <Navbar />
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
      <Toaster />
    </Providers>
  );
}