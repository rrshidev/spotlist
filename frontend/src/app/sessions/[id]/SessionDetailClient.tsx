'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { SessionItem } from '@/types';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, User,
  Trash2, Pencil, Loader2, Check, X,
} from 'lucide-react';

export function SessionDetailClient() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<SessionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.sessions.get(id);
      setSession(data);
    } catch {
      setError('Сессия не найдена');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleJoin() {
    try {
      await api.sessions.join(id);
      addToast(t('sessions.joined'), 'success');
      load();
    } catch {
      addToast(t('sessions.error'), 'error');
    }
  }

  async function handleLeave() {
    try {
      await api.sessions.leave(id);
      addToast(t('sessions.left'), 'success');
      load();
    } catch {
      addToast(t('sessions.error'), 'error');
    }
  }

  async function handleDelete() {
    if (!confirm(t('sessions.deleteConfirm'))) return;
    try {
      await api.sessions.delete(id);
      addToast(t('editSpot.saved'), 'success');
      router.push('/sessions');
    } catch {
      addToast(t('sessions.error'), 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50">
        <p>{error || 'Not found'}</p>
      </div>
    );
  }

  const isCreator = user?.id === session.creator_id;
  const isPast = new Date(session.session_date) < new Date(new Date().toDateString());

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('spotDetail.back')}
        </Link>

        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-4">{session.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-6">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[#f97316]" />
                {new Date(session.session_date).toLocaleDateString()}
              </span>
              {session.session_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[#f97316]" />
                  {session.session_time.slice(0, 5)}
                </span>
              )}
              {session.spot_city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#f97316]" />
                  {session.spot_city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User className="w-4 h-4 text-[#f97316]" />
                {session.creator_username || t('sessions.unknownSpot')}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-sm text-white/70">
                <Users className="w-4 h-4 text-[#f97316]" />
                {session.participant_count}
                {session.max_participants ? ` / ${session.max_participants}` : ''}
                {' '}{t('sessions.participants')}
              </div>
              {session.is_joined && (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#39ff14]/20 text-[#39ff14] text-sm">
                  <Check className="w-4 h-4" />
                  {t('sessions.joined')}
                </span>
              )}
            </div>

            {session.spot_name && (
              <Link
                href={`/spots/${session.spot_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f2e] text-white/70 hover:text-white transition-colors text-sm mb-6"
              >
                <MapPin className="w-4 h-4 text-[#f97316]" />
                {t('sessions.onSpot')} {session.spot_name}
              </Link>
            )}

            {session.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-2">{t('sessions.description')}</h2>
                <p className="text-white/70 whitespace-pre-wrap">{session.description}</p>
              </div>
            )}

            {session.participants.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">{t('sessions.participants')}</h2>
                <div className="space-y-2">
                  {session.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#1f1f2e]">
                      <div className="w-8 h-8 rounded-full bg-[#2a2a3e] flex items-center justify-center text-xs text-white font-bold">
                        {p.username[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-white/70 text-sm">{p.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-6 border-t border-[#1f1f2e]">
              {!isPast && (
                user ? (
                  session.is_joined ? (
                    <button
                      onClick={handleLeave}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {t('sessions.leave')}
                    </button>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={session.max_participants ? session.participant_count >= session.max_participants : false}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f97316] text-black font-semibold hover:bg-[#e06510] transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {session.max_participants && session.participant_count >= session.max_participants
                        ? 'Full'
                        : t('sessions.join')
                      }
                    </button>
                  )
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f2e] text-white/70 hover:text-white transition-colors"
                  >
                    {t('sessions.join')}
                  </Link>
                )
              )}
              {isCreator && (
                <>
                  <Link
                    href={`/sessions/${session.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f2e] text-white/70 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    {t('sessions.edit')}
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f2e] text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('sessions.delete')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
