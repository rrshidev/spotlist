'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { SessionItem } from '@/types';
import { SessionCard } from '@/components/SessionCard';
import { Plus, CalendarDays } from 'lucide-react';

export function SessionsPageClient() {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.sessions.list({ page_size: 50 })
      .then((data) => setSessions(data.sessions))
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = sessions.filter((s) => new Date(s.session_date) >= new Date(new Date().toDateString()));
  const past = sessions.filter((s) => new Date(s.session_date) < new Date(new Date().toDateString()));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f97316]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-[#f97316]" />
              {t('sessions.title')}
            </h1>
            <p className="text-white/50 mt-1">Встречи и джемы на спотах</p>
          </div>
          <Link
            href="/sessions/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f97316] text-black font-semibold hover:bg-[#e06510] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('sessions.add')}
          </Link>
        </div>

        {error && (
          <div className="text-red-400 text-center py-8">{error}</div>
        )}

        {!error && sessions.length === 0 && (
          <div className="text-center py-20 text-white/50">
            <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{t('sessions.noSessions')}</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-white mb-4">{t('sessions.upcomingSessions')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {upcoming.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-white/50 mb-4">{t('sessions.pastSessions')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {past.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
