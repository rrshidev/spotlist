'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useI18n } from '@/contexts/I18nContext';
import { MapPin, Mail, Lock, Loader2 } from 'lucide-react';
import TelegramLoginButton, { type TelegramUser } from '@/components/TelegramLoginButton';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8">
          <div className="h-16 w-16 rounded-xl bg-[#1f1f2e] mx-auto mb-4" />
          <div className="h-8 w-48 bg-[#1f1f2e] rounded mx-auto" />
        </div>
      </div>
    );
  }

  return <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const router = useRouter();
  const { login, loginWithTelegram } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      addToast(t('auth.loginSuccess'), 'success');
      router.push('/');
    } catch (error) {
      addToast(error instanceof Error ? error.message : t('auth.loginError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (tgUser: TelegramUser) => {
    setTgLoading(true);
    try {
      const res = await api.telegram.login(tgUser as unknown as Record<string, unknown>);
      await loginWithTelegram(res.access_token);
      addToast(t('auth.loginSuccess'), 'success');
      const redirect = localStorage.getItem('redirectAfterLogin');
      localStorage.removeItem('redirectAfterLogin');
      router.push(redirect || '/');
    } catch (error) {
      addToast(error instanceof Error ? error.message : t('auth.loginError'), 'error');
    } finally {
      setTgLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#39ff14] to-[#00f5ff] flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('auth.login')}</h1>
            <p className="text-white/50 mt-2">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white placeholder:text-white/40 focus:border-[#39ff14] focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white placeholder:text-white/40 focus:border-[#39ff14] focus:outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#39ff14] to-[#00f5ff] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {t('auth.submitLogin')}
            </button>
          </form>

          <div className="mt-6 mb-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1f1f2e]" />
            <span className="text-xs text-white/40">или</span>
            <div className="flex-1 h-px bg-[#1f1f2e]" />
          </div>

          <div className="flex justify-center">
            {tgLoading ? (
              <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
            ) : (
              <TelegramLoginButton onAuth={handleTelegramAuth} />
            )}
          </div>

          <p className="text-center text-white/50 mt-6">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-[#39ff14] hover:underline">
              {t('auth.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}