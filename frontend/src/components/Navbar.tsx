'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Plus, User, LogOut, Shield, Menu, X, BookmarkCheck, Package, CalendarDays, Heart, Handshake } from 'lucide-react';
import { useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-[#12121a] border-b border-[#1f1f2e] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="SpotList" className="w-10 h-10" />
            <span className="text-xl font-bold bg-gradient-to-r from-[#39ff14] to-[#00f5ff] bg-clip-text text-transparent">
              SPOTLIST
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="text-white/70 hover:text-[#39ff14] transition-colors"
            >
              {t('nav.map')}
            </Link>
            <Link
              href="/rentals"
              className="text-white/70 hover:text-[#00f5ff] transition-colors flex items-center gap-1"
            >
              <Package className="w-4 h-4" />
              {t('rentals.title')}
            </Link>
            <Link
              href="/sessions"
              className="text-white/70 hover:text-[#f97316] transition-colors flex items-center gap-1"
            >
              <CalendarDays className="w-4 h-4" />
              {t('sessions.title')}
            </Link>
            <Link
              href="/partnership"
              className="text-white/70 hover:text-[#39ff14] transition-colors flex items-center gap-1"
            >
              <Handshake className="w-4 h-4" />
              {t('partner.navLink')}
            </Link>
            <Link
              href="/donate"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff6b9d] flex items-center justify-center hover:shadow-lg hover:shadow-[#ff1493]/30 transition-all duration-300 group"
              title={t('donate.title')}
            >
              <Heart className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </Link>
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                <Link
                  href="/spots/new"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#39ff14] text-black font-semibold hover:bg-[#32e612] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('nav.addSpot')}
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f2e] text-[#00f5ff] w-fit"
                  onClick={() => setMobileOpen(false)}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  Сохранённые
                </Link>
                <Link
                  href="/wishlist"
                  className="text-white/70 hover:text-[#00f5ff] transition-colors"
                  title="Сохранённые"
                >
                  <BookmarkCheck className="w-5 h-5" />
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
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#39ff14] to-[#00f5ff] text-black font-semibold hover:opacity-90 transition-opacity"
                >
                  {t('nav.register')}
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
                {t('nav.map')}
              </Link>
              <Link
                href="/rentals"
                className="text-white/70 hover:text-[#00f5ff] transition-colors flex items-center gap-1"
                onClick={() => setMobileOpen(false)}
              >
                <Package className="w-4 h-4" />
                {t('rentals.title')}
              </Link>
              <Link
                href="/sessions"
                className="text-white/70 hover:text-[#f97316] transition-colors flex items-center gap-1"
                onClick={() => setMobileOpen(false)}
              >
                <CalendarDays className="w-4 h-4" />
                {t('sessions.title')}
              </Link>
              <Link
                href="/partnership"
                className="text-white/70 hover:text-[#39ff14] transition-colors flex items-center gap-1"
                onClick={() => setMobileOpen(false)}
              >
                <Handshake className="w-4 h-4" />
                {t('partner.navLink')}
              </Link>
              <Link
                href="/donate"
                className="flex items-center gap-2 text-white/70 hover:text-[#ff1493] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff6b9d] flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span>{t('donate.navLink')}</span>
              </Link>
              <LanguageSwitcher />
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
                    {t('nav.profile')}
                  </Link>
                  {user?.role?.toLowerCase() === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-[#ff1493]"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t('nav.admin')}
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="text-left text-red-400"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-white/70"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#39ff14] to-[#00f5ff] text-black font-semibold w-fit"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t('nav.register')}
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