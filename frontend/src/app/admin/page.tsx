'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { AdminStats, Spot, User, Comment } from '@/types';
import { Shield, Users, MapPin, MessageSquare, AlertTriangle, Check, X, Loader2, ExternalLink } from 'lucide-react';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'spots' | 'users' | 'reports'>('overview');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role?.toLowerCase() !== 'admin')) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, user, router]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statsData, spotsData, usersData, reportsData] = await Promise.all([
          api.admin.stats() as Promise<AdminStats>,
          api.admin.spots() as Promise<Spot[]>,
          api.admin.users() as Promise<User[]>,
          api.admin.reports() as Promise<any[]>,
        ]);
        setStats(statsData);
        setSpots(spotsData);
        setUsers(usersData);
        setReports(reportsData);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    }
    if (user?.role?.toLowerCase() === 'admin') {
      fetchData();
    }
  }, [user]);

  const handleApproveSpot = async (spotId: string) => {
    try {
      await api.admin.approveSpot(spotId);
      setSpots(spots.map(s => s.id === spotId ? { ...s, is_checked: true } : s));
      addToast('Спот одобрен', 'success');
    } catch {
      addToast('Ошибка', 'error');
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm('Удалить спот?')) return;
    try {
      await api.admin.deleteSpot(spotId);
      setSpots(spots.filter(s => s.id !== spotId));
      addToast('Спот удалён', 'success');
    } catch {
      addToast('Ошибка', 'error');
    }
  };

  const handleToggleBan = async (userId: string) => {
    try {
      await api.admin.toggleBan(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
      const targetUser = users.find(u => u.id === userId);
      addToast(targetUser?.is_active ? 'Пользователь забанен' : 'Пользователь разбанен', 'success');
    } catch {
      addToast('Ошибка', 'error');
    }
  };

  const handleIgnoreReport = async (commentId: string) => {
    try {
      await api.admin.ignoreReport(commentId);
      setReports(reports.filter(r => r.id !== commentId));
      addToast('Жалоба обработана', 'success');
    } catch {
      addToast('Ошибка', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
      </div>
    );
  }

  if (user?.role?.toLowerCase() !== 'admin') return null;

  const uncheckedSpots = spots.filter(s => !s.is_checked);

  return (
    <div className="flex-1 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#ff1493]/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#ff1493]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Админ-панель</h1>
            <p className="text-sm text-white/50">Управление приложением</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#39ff14]/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#39ff14]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.total_spots || 0}</p>
                <p className="text-xs text-white/60">Всего спотов</p>
              </div>
            </div>
          </div>
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.unchecked_spots || 0}</p>
                <p className="text-xs text-white/60">На проверке</p>
              </div>
            </div>
          </div>
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00f5ff]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#00f5ff]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.total_users || 0}</p>
                <p className="text-xs text-white/60">Пользователей</p>
              </div>
            </div>
          </div>
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.reported_comments || 0}</p>
                <p className="text-xs text-white/60">Жалоб</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl">
          <div className="flex border-b border-[#1f1f2e] overflow-x-auto">
            <button
              onClick={() => setActiveTab('spots')}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'spots'
                  ? 'text-[#39ff14] border-b-2 border-[#39ff14]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Споты на проверку
              {uncheckedSpots.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-xs">
                  {uncheckedSpots.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'users'
                  ? 'text-[#39ff14] border-b-2 border-[#39ff14]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Пользователи
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'reports'
                  ? 'text-[#39ff14] border-b-2 border-[#39ff14]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Жалобы
              {(stats?.reported_comments || 0) > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs">
                  {stats?.reported_comments}
                </span>
              )}
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'spots' && (
              <div className="space-y-4">
                {uncheckedSpots.length > 0 ? (
                  uncheckedSpots.map((spot) => (
                    <div key={spot.id} className="p-4 bg-[#0a0a0f] rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <a 
                            href={`/spots/${spot.id}`} 
                            target="_blank"
                            className="font-bold text-white hover:text-[#39ff14] transition-colors"
                          >
                            {spot.name}
                          </a>
                          <p className="text-sm text-white/60">{spot.city}</p>
                          <p className="text-xs text-white/40 mt-1">
                            от {spot.author_username || 'Неизвестно'} •{' '}
                            {new Date(spot.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveSpot(spot.id)}
                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            title="Одобрить"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSpot(spot.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            title="Удалить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-white/40 py-8">Нет спотов на проверку</p>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                {users.map((u) => (
                  <div key={u.id} className="p-4 bg-[#0a0a0f] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#39ff14] to-[#00f5ff] flex items-center justify-center">
                        <Users className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{u.username}</span>
                          {u.role === 'admin' && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ff1493]/20 text-[#ff1493] text-xs">
                              Админ
                            </span>
                          )}
                          {!u.is_active && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                              Забанен
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{u.email}</p>
                      </div>
                    </div>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleBan(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          u.is_active
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        {u.is_active ? 'Забанить' : 'Разбанить'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <div key={report.id} className="p-4 bg-[#0a0a0f] rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{report.username}</span>
                            <span className="text-xs text-white/40">→</span>
                            <span className="text-sm text-white/60">{report.report_reason}</span>
                          </div>
                          <p className="mt-2 text-white/80">{report.content}</p>
                          <p className="text-xs text-white/40 mt-2">
                            от @{report.reporter_username} • {new Date(report.created_at).toLocaleString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={`/spots/${report.spot_id}`}
                            target="_blank"
                            className="p-2 rounded-lg bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14]/30"
                            title="Открыть спот"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleIgnoreReport(report.id)}
                            className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                            title="Игнорировать"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-white/40 py-8">Нет жалоб</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}