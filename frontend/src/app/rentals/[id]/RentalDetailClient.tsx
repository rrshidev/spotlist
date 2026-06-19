'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Rental } from '@/types';
import { ArrowLeft, MapPin, Package, Phone, Send, Globe, Clock, Trash2, Pencil, Loader2, Image as ImageIcon } from 'lucide-react';

export function RentalDetailClient() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.rentals.get(id)
      .then(setRental)
      .catch(() => setError('Прокат не найден'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm(t('rentals.deleteConfirm'))) return;
    try {
      await api.rentals.delete(id);
      addToast(t('rentals.deleteConfirm'), 'success');
      router.push('/rentals');
    } catch {
      addToast(t('rentals.error'), 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00f5ff]" />
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50">
        <p>{error || 'Not found'}</p>
      </div>
    );
  }

  const isOwner = user?.id === rental.owner_id;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/rentals"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('spotDetail.back')}
        </Link>

        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl overflow-hidden">
          {rental.media && rental.media.length > 0 && (
            <div className="relative h-72 bg-[#0a0a0f]">
              <img
                src={rental.media[0].startsWith('http') ? rental.media[0] : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || ''}${rental.media[0]}`}
                alt={rental.name}
                className="w-full h-full object-cover"
              />
              {rental.media.length > 1 && (
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/70 text-xs text-white flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {rental.media.length}
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-4">{rental.name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-6">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#00f5ff]" />
                {rental.city}
                {rental.address && <span className="text-white/40">· {rental.address}</span>}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(rental.created_at).toLocaleDateString()}
              </span>
            </div>

            {rental.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-2">{t('rentals.description')}</h2>
                <p className="text-white/70 whitespace-pre-wrap">{rental.description}</p>
              </div>
            )}

            {rental.items && rental.items.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#00f5ff]" />
                  {t('rentals.items')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {rental.items.map((item) => (
                    <span key={item} className="px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-sm text-white/70">
                      {t('rentalItems.' + item)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {rental.prices && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-2">{t('rentals.prices')}</h2>
                <p className="text-white/70 whitespace-pre-wrap">{rental.prices}</p>
              </div>
            )}

            {rental.contacts && Object.keys(rental.contacts).length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">{t('rentals.contacts')}</h2>
                <div className="space-y-2">
                  {rental.contacts.telegram && (
                    <a
                      href={`https://t.me/${rental.contacts.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#0088cc] hover:text-[#00a3ee] transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {rental.contacts.telegram}
                    </a>
                  )}
                  {rental.contacts.phone && (
                    <a
                      href={`tel:${rental.contacts.phone}`}
                      className="flex items-center gap-2 text-[#39ff14] hover:text-[#32e612] transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {rental.contacts.phone}
                    </a>
                  )}
                  {rental.contacts.website && (
                    <a
                      href={rental.contacts.website.startsWith('http') ? rental.contacts.website : `https://${rental.contacts.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#00f5ff] hover:text-[#00d4e0] transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      {rental.contacts.website}
                    </a>
                  )}
                </div>
              </div>
            )}

            {isOwner && (
              <div className="flex items-center gap-3 pt-6 border-t border-[#1f1f2e]">
                <Link
                  href={`/rentals/${rental.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f2e] text-white/70 hover:text-white transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  {t('rentals.edit')}
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f2e] text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('rentals.delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
