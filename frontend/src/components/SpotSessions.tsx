'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { SessionItem } from '@/types';
import { CalendarDays, Plus, Users, Calendar, Clock } from 'lucide-react';

interface SpotSessionsProps {
  spotId: string;
}

export function SpotSessions({ spotId }: SpotSessionsProps) {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sessions.list({ spot_id: spotId, page_size: 5 })
      .then((data) => setSessions(data.sessions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [spotId]);

  const upcoming = sessions.filter((s) => new Date(s.session_date) >= new Date(new Date().toDateString()));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/40 text-sm">
        <CalendarDays className="w-4 h-4 animate-pulse" />
        <span>{t('sessions.spotsSessions')}...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#f97316]" />
          {t('sessions.sessionsOnSpot')}
        </h2>
        <Link
          href={`/sessions/new?spot_id=${spotId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f97316] text-black text-sm font-semibold hover:bg-[#e06510] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('sessions.add')}
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-white/40 text-sm">{t('sessions.noSessions')}</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="block p-3 rounded-xl bg-[#0a0a0f] hover:bg-[#1f1f2e] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-white font-medium text-sm">{s.title}</p>
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <Users className="w-3 h-3" />
                  {s.participant_count}
                  {s.max_participants ? `/${s.max_participants}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#f97316]" />
                  {new Date(s.session_date).toLocaleDateString()}
                </span>
                {s.session_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#f97316]" />
                    {s.session_time.slice(0, 5)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
