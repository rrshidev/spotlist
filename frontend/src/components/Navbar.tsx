'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Plus, User, LogOut, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-[#12121a] border-b border-[#1f1f2e] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#39ff14] to-[#00f5ff] flex items-center justify-center">
              <MapPin className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#39ff14] to-[#00f5ff] bg-clip-text text-transparent">
              SPOTLIST
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="text-white/70 hover:text-[#39ff14] transition-colors"
            >
              Карта
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/spots/new"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#39ff14] text-black font-semibold hover:bg-[#32e612] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить спот
                </Link>
                <Link
                  href="/profile"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
                {user?.role?.toLowerCase() === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-[#ff1493] hover:text-[#ff1493]/80 transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-white/70 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#39ff14] to-[#00f5ff] text-black font-semibold hover:opacity-90 transition-opacity"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-[#1f1f2e]">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-white/70 hover:text-[#39ff14] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Карта
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/spots/new"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#39ff14] text-black font-semibold w-fit"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Plus className="w-4 h-4" />
                    Добавить спот
                  </Link>
                  <Link
                    href="/profile"
                    className="text-white/70 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Профиль
                  </Link>
                  {user?.role?.toLowerCase() === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-[#ff1493]"
                      onClick={() => setMobileOpen(false)}
                    >
                      Админка
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="text-left text-red-400"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-white/70"
                    onClick={() => setMobileOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#39ff14] to-[#00f5ff] text-black font-semibold w-fit"
                    onClick={() => setMobileOpen(false)}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}