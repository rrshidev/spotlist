'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Spot } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { MapPin, Clock, Image as ImageIcon, Navigation, Heart, Video, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';

interface SpotCardProps {
  spot: Spot;
}

const categoryLabels: Record<string, string> = {
  park: 'Парк',
  street: 'Стрит',
  roller: 'Роллер-дром',
  routes: 'Маршруты',
};

const categoryColors: Record<string, string> = {
  park: 'from-purple-600 to-purple-400',
  street: 'from-green-600 to-green-400',
  roller: 'from-blue-600 to-blue-400',
  routes: 'from-orange-600 to-orange-400',
};

export function SpotCard({ spot }: SpotCardProps) {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [liked, setLiked] = useState(spot.liked || false);
  const [likesCount, setLikesCount] = useState(spot.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const hasPhotos = spot.media && spot.media.length > 0 && spot.media[0];

  function getMediaUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return API_URL.replace('/api/v1', '') + url;
  }

  async function handleLike(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast('Войди, чтобы ставить лайки', 'error');
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    try {
      await api.likes.toggle(spot.id);
      setLiked(!liked);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);
    } catch {
      addToast('Ошибка при лайке', 'error');
    } finally {
      setIsLiking(false);
    }
  }

  return (
    <Link href={`/spots/${spot.id}`}>
      <div className="group bg-[#12121a] border border-[#1f1f2e] rounded-xl overflow-hidden hover:border-[#39ff14]/50 transition-all duration-300">
        <div className="relative h-40 bg-gradient-to-br from-[#1f1f2e] to-[#0a0a0f] flex items-center justify-center">
          {hasPhotos ? (
            <img
              src={getMediaUrl(spot.media[0])}
              alt={spot.name}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="text-[#39ff14]/30">
              <MapPin className="w-12 h-12" />
            </div>
          )}
          
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r ${categoryColors[spot.category] || 'from-gray-600 to-gray-400'} text-xs font-semibold text-white`}>
            {categoryLabels[spot.category] || spot.category}
          </div>

          {spot.obstacles && spot.obstacles.length > 0 && (
            <div className="absolute top-3 right-3 flex gap-1">
              {spot.obstacles.slice(0, 3).map((obs, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono"
                  title={obs.count ? `${obs.type} (${obs.count})` : obs.type}
                >
                  {obs.type === 'ledge' ? '▬' : obs.type === 'rail' ? '═' : obs.type === 'stairs' ? `⊞${obs.count??''}` : obs.type === 'hubba' ? '╱' : obs.type === 'gap' ? '⤉' : obs.type === 'bank' ? '╲' : obs.type === 'manual_pad' ? '▭' : obs.type === 'bowl' ? '○' : obs.type === 'quarter_pipe' ? '⌒' : obs.type === 'wallride' ? '⊢' : obs.type[0]}
                </span>
              ))}
              {spot.obstacles.length > 3 && (
                <span className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white">+{spot.obstacles.length - 3}</span>
              )}
            </div>
          )}

          {spot.status && spot.status !== 'unknown' && (
            <div className="absolute top-12 right-3">
              {spot.status === 'active' ? (
                <ShieldCheck className="w-5 h-5 text-green-400 drop-shadow-lg" />
              ) : spot.status === 'bust' ? (
                <ShieldX className="w-5 h-5 text-red-400 drop-shadow-lg" />
              ) : spot.status === 'risky' ? (
                <ShieldAlert className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
              ) : null}
            </div>
          )}

          {spot.distance && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/70 text-xs text-white flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {spot.distance} км
            </div>
          )}

          <button
            onClick={handleLike}
            className={`absolute bottom-3 left-3 px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${
              liked 
                ? 'bg-[#ff1493]/80 text-white' 
                : 'bg-black/70 text-white/70 hover:text-[#ff1493]'
            }`}
          >
            <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
            {likesCount}
          </button>

          {hasPhotos && (
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/70 text-xs text-white flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {spot.media?.length || 0}
              {spot.video && <Video className="w-3 h-3 ml-1" />}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg text-white group-hover:text-[#39ff14] transition-colors line-clamp-1">
            {spot.name}
          </h3>
          
          <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
            <MapPin className="w-4 h-4 text-[#39ff14]" />
            <span className="line-clamp-1">{spot.city}</span>
          </div>

          {spot.description && (
            <p className="mt-2 text-sm text-white/50 line-clamp-2">
              {spot.description}
            </p>
          )}

          {spot.ride_types && spot.ride_types.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {spot.ride_types.map((rt) => (
                <span key={rt} className="px-1.5 py-0.5 rounded bg-[#1f1f2e] text-[10px] text-white/70">
                  {rt === 'skateboard' ? '🛹 Скейт' : rt === 'rollerblades' ? '🛼 Ролики' : rt === 'bmx' ? '🚲 BMX' : rt === 'scooter' ? '🛴 Самокат' : rt === 'longboard' ? '🛹 Лонгборд' : rt === 'surfskate' ? '🛹 Сёрфскейт' : rt === 'mountainboard' ? '🛹 Маунтин' : rt === 'motorcycle' ? '🏍️ Мото' : rt === 'sup' ? '🏄 САП' : rt === 'kayak' ? '🛶 Каяк' : rt === 'cycling' ? '🚲 Вело' : rt === 'running' ? '🏃 Бег' : rt === 'hiking' ? '🥾 Поход' : '⭐'}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(spot.created_at).toLocaleDateString('ru-RU')}
            </span>
            {spot.author_username && (
              <span>от {spot.author_username}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}