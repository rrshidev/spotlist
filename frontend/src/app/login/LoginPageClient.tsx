'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { MapPin, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPageClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      addToast('Успешный вход!', 'success');
      router.push('/');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Ошибка входа', 'error');
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-white">Вход в аккаунт</h1>
            <p className="text-white/50 mt-2">Добро пожаловать обратно!</p>
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
                placeholder="Пароль"
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
              Войти
            </button>
          </form>

          <p className="text-center text-white/50 mt-6">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-[#39ff14] hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}