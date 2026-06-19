'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Spot } from '@/types';
import { ArrowLeft, Loader2, MapPin, Search } from 'lucide-react';

export function NewSessionPageClient() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSpotId = searchParams.get('spot_id');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [spotQuery, setSpotQuery] = useState('');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedSpotId) {
      api.spots.get(preselectedSpotId).then(setSelectedSpot).catch(() => {});
    }
  }, [preselectedSpotId]);

  async function handleSpotSearch(query: string) {
    setSpotQuery(query);
    if (query.length < 2) {
      setSpots([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.spots.list({ city: query, page_size: 10 });
      setSpots(data.spots);
    } catch {
      setSpots([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSpot) {
      addToast('Выберите спот', 'error');
      return;
    }
    if (!title.trim() || !sessionDate) {
      addToast(t('newSpot.requiredFields'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.sessions.create({
        spot_id: selectedSpot.id,
        title: title.trim(),
        description: description.trim() || undefined,
        session_date: sessionDate,
        session_time: sessionTime || undefined,
        max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
      });
      addToast(t('sessions.success'), 'success');
      router.push('/sessions');
    } catch {
      addToast(t('sessions.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('spotDetail.back')}
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">{t('sessions.add')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Спот *</label>
            {selectedSpot ? (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#f97316]">
                <div>
                  <p className="text-white font-medium">{selectedSpot.name}</p>
                  <p className="text-xs text-white/40">{selectedSpot.city}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedSpot(null); setSpotQuery(''); }}
                  className="text-white/40 hover:text-white text-sm"
                >
                  {t('filter.reset')}
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={spotQuery}
                  onChange={(e) => handleSpotSearch(e.target.value)}
                  placeholder="Поиск спота по городу..."
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#f97316]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#f97316]" />
                )}
                {spots.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl overflow-hidden">
                    {spots.map((spot) => (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => {
                          setSelectedSpot(spot);
                          setSpots([]);
                          setSpotQuery('');
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-[#2a2a3e] transition-colors flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-[#f97316]" />
                        <div>
                          <p className="text-sm">{spot.name}</p>
                          <p className="text-xs text-white/40">{spot.city}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('sessions.titleField')} *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('sessions.titlePlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#f97316]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('sessions.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('sessions.descriptionPlaceholder')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#f97316] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{t('sessions.date')} *</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white focus:outline-none focus:border-[#f97316]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{t('sessions.time')}</label>
              <input
                type="time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white focus:outline-none focus:border-[#f97316]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('sessions.maxParticipants')}</label>
            <input
              type="number"
              min="0"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder={t('sessions.maxParticipantsPlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#f97316]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#f97316] text-black font-semibold hover:bg-[#e06510] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('sessions.add')}
          </button>
        </form>
      </div>
    </div>
  );
}
