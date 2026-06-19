'use client';

import Link from 'next/link';
import { Rental } from '@/types';
import { useI18n } from '@/contexts/I18nContext';
import { MapPin, Package, Clock } from 'lucide-react';

interface RentalCardProps {
  rental: Rental;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return API_URL.replace('/api/v1', '') + url;
}

export function RentalCard({ rental }: RentalCardProps) {
  const { t } = useI18n();
  const hasPhotos = rental.media && rental.media.length > 0 && rental.media[0];

  return (
    <Link href={`/rentals/${rental.id}`}>
      <div className="group bg-[#12121a] border border-[#1f1f2e] rounded-xl overflow-hidden hover:border-[#00f5ff]/50 transition-all duration-300">
        <div className="relative h-40 bg-gradient-to-br from-[#1f1f2e] to-[#0a0a0f] flex items-center justify-center">
          {hasPhotos ? (
            <img
              src={getMediaUrl(rental.media[0])}
              alt={rental.name}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="text-[#00f5ff]/30">
              <Package className="w-12 h-12" />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg text-white group-hover:text-[#00f5ff] transition-colors line-clamp-1">
            {rental.name}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
            <MapPin className="w-4 h-4 text-[#00f5ff]" />
            <span className="line-clamp-1">{rental.city}</span>
            {rental.address && (
              <span className="text-white/40 truncate">· {rental.address}</span>
            )}
          </div>

          {rental.description && (
            <p className="mt-2 text-sm text-white/50 line-clamp-2">
              {rental.description}
            </p>
          )}

          {rental.items && rental.items.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {rental.items.map((item) => (
                <span key={item} className="px-1.5 py-0.5 rounded bg-[#1f1f2e] text-[10px] text-white/70">
                  {t('rentalItems.' + item)}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
            {rental.owner_username && (
              <span>{rental.owner_username}</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(rental.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
