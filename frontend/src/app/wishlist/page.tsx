'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import type { SavedSpotItem } from '@/types';
import { BookmarkCheck, MapPin, Loader2, ArrowLeft, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [spots, setSpots] = useState<SavedSpotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    async function fetchSaved() {
      try {
        const data = await api.wishlist.list();
        setSpots(data as SavedSpotItem[]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [isAuthenticated, authLoading, router]);

  const handleRemove = async (spotId: string) => {
    try {
      await api.wishlist.toggle(spotId);
      setSpots(spots.filter(s => s.spot_id !== spotId));
    } catch {
      // ignore
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('spotDetail.back')}
      </button>

      <div className="flex items-center gap-3 mb-8">
        <BookmarkCheck className="w-8 h-8 text-[#00f5ff]" />
        <h1 className="text-2xl font-bold text-white">Сохранённые споты</h1>
      </div>

      {spots.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BookmarkCheck className="w-16 h-16 text-white/20 mb-4" />
          <h3 className="text-xl font-semibold text-white/60 mb-2">Нет сохранённых спотов</h3>
          <p className="text-white/40">Сохраняй споты, чтобы не потерять их</p>
          <Link
            href="/"
            className="mt-4 px-4 py-2 rounded-lg bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14]/30 transition-colors"
          >
            На карту
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spots.map((item) => (
            <Link
              key={item.id}
              href={`/spots/${item.spot_id}`}
              className="group bg-[#12121a] border border-[#1f1f2e] rounded-xl overflow-hidden hover:border-[#00f5ff]/50 transition-all"
            >
              <div className="relative h-36 bg-gradient-to-br from-[#1f1f2e] to-[#0a0a0f] flex items-center justify-center">
                {item.media && item.media[0] ? (
                  <img
                    src={item.media[0].startsWith('http') ? item.media[0] : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || ''}${item.media[0]}`}
                    alt={item.spot_name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <MapPin className="w-10 h-10 text-[#00f5ff]/30" />
                )}
                <button
                  onClick={(e) => { e.preventDefault(); handleRemove(item.spot_id); }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white group-hover:text-[#00f5ff] transition-colors">
                  {item.spot_name}
                </h3>
                <p className="mt-1 text-sm text-white/50 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#00f5ff]" />
                  {item.city}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
