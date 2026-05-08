'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Spot, Comment } from '@/types';
import { SpotCard } from '@/components/SpotCard';
import { User, MapPin, Clock, Loader2, LogOut, Shield } from 'lucide-react';

interface UserSpot extends Spot {
  comments_count?: number;
}

interface UserComment extends Comment {
  spot_name?: string;
}

export default function ProfilePageClient() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [userSpots, setUserSpots] = useState<UserSpot[]>([]);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'spots' | 'comments'>('spots');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const allSpots = await api.admin.spots() as Spot[];
        const mySpots = allSpots.filter(s => s.author_id === user?.id);
        setUserSpots(mySpots);
        
        const commentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/comments/user`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (commentsRes.ok) {
          setUserComments(await commentsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#39ff14] to-[#00f5ff] flex items-center justify-center">
                <User className="w-10 h-10 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{user.username}</h1>
                <p className="text-white/60">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {user.role?.toLowerCase() === 'admin' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#ff1493]/20 text-[#ff1493] text-xs font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Админ
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    с {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-[#0a0a0f] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#39ff14]">{userSpots.length}</p>
              <p className="text-xs text-white/60">Спотов</p>
            </div>
            <div className="p-4 bg-[#0a0a0f] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#00f5ff]">0</p>
              <p className="text-xs text-white/60">Комментариев</p>
            </div>
            <div className="p-4 bg-[#0a0a0f] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#ff1493]">
                {userSpots.filter(s => s.is_checked).length}/{userSpots.length}
              </p>
              <p className="text-xs text-white/60">Проверено</p>
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl overflow-hidden">
          <div className="flex border-b border-[#1f1f2e]">
            <button
              onClick={() => setActiveTab('spots')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'spots'
                  ? 'text-[#39ff14] border-b-2 border-[#39ff14]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Мои споты
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'text-[#39ff14] border-b-2 border-[#39ff14]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Комментарии
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'spots' ? (
              userSpots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userSpots.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">У тебя пока нет спотов</p>
                  <button
                    onClick={() => router.push('/spots/new')}
                    className="mt-4 px-4 py-2 rounded-lg bg-[#39ff14] text-black font-medium"
                  >
                    Добавить спот
                  </button>
                </div>
              )
            ) : userComments.length > 0 ? (
              <div className="space-y-4">
                {userComments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-[#0a0a0f] rounded-xl hover:bg-[#0a0a0f]/80 transition-colors cursor-pointer" onClick={() => router.push(`/spots/${comment.spot_id}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3 text-[#39ff14]" />
                      <span className="text-sm text-[#39ff14] font-medium truncate">{comment.spot_name || 'Спот'}</span>
                    </div>
                    <p className="text-white/80 text-sm line-clamp-2">{comment.content}</p>
                    <p className="text-xs text-white/40 mt-1">{new Date(comment.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">У тебя пока нет комментариев</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}