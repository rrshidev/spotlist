'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { Rental } from '@/types';
import { RentalCard } from '@/components/rental/RentalCard';
import { Plus, Package } from 'lucide-react';

export function RentalsPageClient() {
  const { t } = useI18n();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.rentals.list({ page_size: 50 })
      .then((data) => setRentals(data.rentals))
      .catch(() => setError('Failed to load rentals'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f5ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-[#00f5ff]" />
              {t('rentals.title')}
            </h1>
            <p className="text-white/50 mt-1">Прокат снаряжения рядом с тобой</p>
          </div>
          <Link
            href="/rentals/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00f5ff] text-black font-semibold hover:bg-[#00d4e0] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('rentals.add')}
          </Link>
        </div>

        {error && (
          <div className="text-red-400 text-center py-8">{error}</div>
        )}

        {!error && rentals.length === 0 && (
          <div className="text-center py-20 text-white/50">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{t('rentals.noRentals')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentals.map((rental) => (
            <RentalCard key={rental.id} rental={rental} />
          ))}
        </div>
      </div>
    </div>
  );
}
