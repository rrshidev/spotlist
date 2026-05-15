import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import NewSpotPageClient from './NewSpotPageClient';

export default function NewSpotPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
      </div>
    }>
      <NewSpotPageClient />
    </Suspense>
  );
}
