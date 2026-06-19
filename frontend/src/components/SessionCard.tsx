'use client';

import Link from 'next/link';
import { SessionItem } from '@/types';
import { useI18n } from '@/contexts/I18nContext';
import { Calendar, Clock, MapPin, Users, User } from 'lucide-react';

interface SessionCardProps {
  session: SessionItem;
}

export function SessionCard({ session }: SessionCardProps) {
  const { t } = useI18n();
  const isPast = new Date(session.session_date) < new Date(new Date().toDateString());

  return (
    <Link href={`/sessions/${session.id}`}>
      <div className={`group bg-[#12121a] border border-[#1f1f2e] rounded-xl overflow-hidden hover:border-[#f97316]/50 transition-all duration-300 ${isPast ? 'opacity-50' : ''}`}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-lg text-white group-hover:text-[#f97316] transition-colors">
              {session.title}
            </h3>
            {session.max_participants && (
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                session.participant_count >= session.max_participants
                  ? 'bg-red-900/50 text-red-400'
                  : 'bg-[#1f1f2e] text-white/60'
              }`}>
                <Users className="w-3 h-3" />
                {session.participant_count}/{session.max_participants}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#f97316]" />
              {new Date(session.session_date).toLocaleDateString()}
            </span>
            {session.session_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#f97316]" />
                {session.session_time.slice(0, 5)}
              </span>
            )}
            {session.spot_city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#f97316]" />
                {session.spot_city}
              </span>
            )}
          </div>

          {session.spot_name && (
            <p className="text-xs text-white/40 mb-2">
              {t('sessions.onSpot')} {session.spot_name}
            </p>
          )}

          {session.description && (
            <p className="text-sm text-white/50 line-clamp-2 mb-3">
              {session.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-white/40">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {session.creator_username || t('sessions.unknownSpot')}
            </span>
            {session.is_joined && (
              <span className="text-[#39ff14]">{t('sessions.joined')}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
