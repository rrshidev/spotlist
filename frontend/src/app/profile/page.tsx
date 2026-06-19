'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Spot, User } from '@/types';
import { SpotCard } from '@/components/SpotCard';
import { useI18n } from '@/contexts/I18nContext';
import { User as UserIcon, MapPin, Loader2, LogOut, Shield, Edit, Camera, MapPinned, Activity, FileText, Save, X, MessageCircle, Copy, Check, Users } from 'lucide-react';
import TelegramLoginButton, { type TelegramUser } from '@/components/TelegramLoginButton';
import { PushPrompt } from '@/components/PushPrompt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return '';
  const av = avatar as string;
  if (av.startsWith('http')) return av;
  const baseUrl = API_URL.replace('/api/v1', '');
  return baseUrl + av;
}

function ReferralSection() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const refLink = `${window.location.origin}?ref=${user.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  return (
    <div className="p-4 bg-[#0a0a0f] rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <Users className="w-5 h-5 text-[#00f5ff]" />
        <div>
          <p className="text-white text-sm font-medium">{t('referral.title')}</p>
          <p className="text-white/40 text-xs">{t('referral.subtitle')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={refLink}
          className="flex-1 bg-[#12121a] border border-[#1f1f2e] rounded-lg px-3 py-2 text-white/70 text-xs font-mono outline-none"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1f1f2e] hover:bg-[#2a2a3e] transition-colors text-white/60 hover:text-white text-xs"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-[#39ff14]" /> {t('referral.copied')}</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> {t('referral.copy')}</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useI18n();
  const { user, isAuthenticated, isLoading: authLoading, logout, setUser } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [userSpots, setUserSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'spots' | 'comments' | 'settings'>('spots');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    city: '',
    skating_style: '',
    bio: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const mySpots = await api.spots.my() as Spot[];
        setUserSpots(mySpots);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
      setFormData({
        username: user.username || '',
        city: user.city || '',
        skating_style: user.skating_style || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSaving(true);
    try {
      const result = await api.uploads.upload(file) as { url: string };
      const updated = await api.auth.update({ avatar: result.url }) as User;
      setUser(updated);
      addToast(t('profile.avatarUpdated'), 'success');
    } catch (error) {
      addToast(t('profile.uploadError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.auth.update(formData) as User;
      setUser(updated);
      setEditing(false);
      addToast(t('profile.profileUpdated'), 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : t('profile.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

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
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#39ff14] to-[#00f5ff] flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={getAvatarUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-black" />
                  )}
                </div>
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[#39ff14] text-black hover:opacity-90 transition-opacity"
                  title={t('profile.changeAvatar')}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="px-3 py-2 bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg text-white"
                      placeholder={t('profile.placeholderName')}
                    />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="px-3 py-2 bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg text-white block w-full"
                      placeholder={t('profile.placeholderCity')}
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-white">{user.username}</h1>
                    {user.city && (
                      <p className="text-white/60 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {user.city}
                      </p>
                    )}
                  </>
                )}
                <p className="text-white/60">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {user.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#ff1493]/20 text-[#ff1493] text-xs font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {t('profile.admin')}
                    </span>
                  )}
                  <span className="text-xs text-white/40">
                    {t('profile.memberSince')} {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 rounded-lg bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14]/30 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 rounded-lg bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14]/30 transition-colors"
                    title={t('profile.editProfile')}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {editing && (
            <div className="mt-4 space-y-3 pt-4 border-t border-[#1f1f2e]">
              <div>
                  <label className="text-sm text-white/60 flex items-center gap-1 mb-1">
                    <Activity className="w-4 h-4" />
                    {t('profile.ridingStyle')}
                  </label>
                <input
                  type="text"
                  value={formData.skating_style}
                  onChange={(e) => setFormData({ ...formData, skating_style: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg text-white"
                  placeholder={t('profile.ridingStylePlaceholder')}
                />
              </div>
              <div>
                  <label className="text-sm text-white/60 flex items-center gap-1 mb-1">
                    <FileText className="w-4 h-4" />
                    {t('profile.about')}
                  </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg text-white resize-none"
                  rows={3}
                  placeholder={t('profile.aboutPlaceholder')}
                />
              </div>
            </div>
          )}

          {!editing && (user.skating_style || user.bio) && (
            <div className="mt-4 pt-4 border-t border-[#1f1f2e]">
              {user.skating_style && (
                <p className="text-white/80 flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-[#39ff14]" />
                  {user.skating_style}
                </p>
              )}
              {user.bio && (
                <p className="text-white/60 text-sm">{user.bio}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-[#0a0a0f] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#39ff14]">{userSpots.length}</p>
              <p className="text-xs text-white/60">{t('profile.spots')}</p>
            </div>
            <div className="p-4 bg-[#0a0a0f] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#00f5ff]">{userSpots.reduce((acc, s) => acc + (s.likes_count || 0), 0)}</p>
              <p className="text-xs text-white/60">{t('profile.likes')}</p>
            </div>
            <div className="p-4 bg-[#0a0a0f] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#ff1493]">
                {userSpots.filter(s => s.is_checked).length}/{userSpots.length}
              </p>
              <p className="text-xs text-white/60">{t('profile.verified')}</p>
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
              {t('profile.mySpots')}
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'text-[#39ff14] border-b-2 border-[#39ff14]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t('profile.tabComments')}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-[#39ff14] border-b-2 border-[#39ff14]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t('profile.settings')}
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
                  <p className="text-white/60">{t('profile.noSpots')}</p>
                  <button
                    onClick={() => router.push('/spots/new')}
                    className="mt-4 px-4 py-2 rounded-lg bg-[#39ff14] text-black font-medium"
                  >
                    {t('profile.addSpot')}
                  </button>
                </div>
              )
            ) : activeTab === 'comments' ? (
              <div className="text-center py-12">
                <p className="text-white/60">{t('profile.commentsSoon')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ReferralSection />
                  <PushPrompt />
                  
                {user.telegram_id ? (
                  <div className="p-4 bg-[#0a0a0f] rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-[#39ff14]" />
                        <div>
                          <p className="text-white text-sm font-medium">Telegram</p>
                          <p className="text-white/40 text-xs">@{user.telegram_username || 'связан'}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await api.telegram.unlink();
                            const userData = await api.auth.me();
                            setUser(userData as User);
                            addToast('Telegram отвязан', 'success');
                          } catch {
                            addToast('Ошибка', 'error');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                      >
                        Отвязать
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#0a0a0f] rounded-xl">
                    <p className="text-white text-sm font-medium mb-3">Привязать Telegram</p>
                    <TelegramLoginButton
                      onAuth={async (tgUser: TelegramUser) => {
                        try {
                          await api.telegram.link(tgUser as unknown as Record<string, unknown>);
                          const userData = await api.auth.me();
                          setUser(userData as User);
                          addToast('Telegram привязан', 'success');
                        } catch {
                          addToast('Ошибка', 'error');
                        }
                      }}
                      buttonSize="small"
                    />
                  </div>
                )}
                <button
                  onClick={logout}
                  className="w-full p-4 bg-red-500/10 rounded-xl text-left flex items-center justify-between text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <span>{t('profile.logout')}</span>
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}