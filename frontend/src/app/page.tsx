import { Suspense } from 'react';
import { HomePageClient } from '@/components/HomePageClient';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
      </div>
    }>
      <HomePageClient />
    </Suspense>
  );
}
